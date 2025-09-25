import Stripe from 'stripe';
import { SubscriptionTier, TIER_PRICING, MODULE_LIMITS } from '@advisor-ai/shared';
import { prisma } from '../config/database';
import { AppError, NotFoundError } from '../utils/errors';
import { emailService } from './email.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe product/price IDs (would be created in Stripe Dashboard)
const STRIPE_PRICE_IDS = {
  [SubscriptionTier.SMB_BASIC]: process.env.STRIPE_PRICE_SMB_BASIC || 'price_smb_basic',
  [SubscriptionTier.SMB_PRO]: process.env.STRIPE_PRICE_SMB_PRO || 'price_smb_pro',
  [SubscriptionTier.ADVISOR_BASIC]: process.env.STRIPE_PRICE_ADVISOR_BASIC || 'price_advisor_basic',
  [SubscriptionTier.ADVISOR_PRO]: process.env.STRIPE_PRICE_ADVISOR_PRO || 'price_advisor_pro',
};

export class SubscriptionService {
  /**
   * Get current subscription for a business
   */
  async getSubscription(businessId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription');
    }

    // Get usage stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.aIGeneration.count({
      where: {
        businessId,
        createdAt: { gte: currentMonth },
      },
    });

    const limits = MODULE_LIMITS[subscription.tier as keyof typeof MODULE_LIMITS];

    return {
      ...subscription,
      usage: {
        aiGenerations: usage,
        aiGenerationsLimit: limits.aiGenerationsPerMonth,
        aiGenerationsPercentage: limits.aiGenerationsPerMonth === -1 
          ? 0 
          : (usage / limits.aiGenerationsPerMonth) * 100,
      },
      limits,
    };
  }

  /**
   * Create or update Stripe customer
   */
  async createOrUpdateCustomer(businessId: string, email: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        metadata: { businessId },
      });
      customerId = customer.id;

      // Update subscription with customer ID
      await prisma.subscription.update({
        where: { businessId },
        data: { stripeCustomerId: customerId },
      });
    }

    return customerId;
  }

  /**
   * Create checkout session for subscription upgrade
   */
  async createCheckoutSession(businessId: string, tier: SubscriptionTier, email: string) {
    const customerId = await this.createOrUpdateCustomer(businessId, email);
    const priceId = STRIPE_PRICE_IDS[tier];

    if (!priceId) {
      throw new AppError('Invalid subscription tier', 400);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
      metadata: {
        businessId,
        tier,
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  /**
   * Create billing portal session
   */
  async createPortalSession(businessId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new AppError('No billing information found', 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
    });

    return {
      portalUrl: session.url,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  /**
   * Handle successful checkout
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const businessId = session.metadata?.businessId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!businessId || !tier) {
      console.error('Missing metadata in checkout session');
      return;
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

    await prisma.subscription.update({
      where: { businessId },
      data: {
        tier,
        stripeSubId: stripeSubscription.id,
        status: 'active',
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Send confirmation email
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: true },
    });

    if (business) {
      await emailService.sendEmail({
        to: business.owner.email,
        subject: 'Subscription Upgraded Successfully',
        html: `
          <h2>Welcome to ${tier}!</h2>
          <p>Your subscription to AdvisorAI Hub has been upgraded successfully.</p>
          <p>You now have access to:</p>
          <ul>
            <li>${MODULE_LIMITS[tier].aiGenerationsPerMonth === -1 ? 'Unlimited' : MODULE_LIMITS[tier].aiGenerationsPerMonth} AI generations per month</li>
            <li>${MODULE_LIMITS[tier].businessesAllowed === -1 ? 'Unlimited' : MODULE_LIMITS[tier].businessesAllowed} businesses</li>
            <li>${MODULE_LIMITS[tier].integrationsAllowed === -1 ? 'Unlimited' : MODULE_LIMITS[tier].integrationsAllowed} integrations</li>
          </ul>
        `,
      });
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubId: stripeSubscription.id },
    });

    if (!subscription) {
      console.error('Subscription not found for Stripe ID:', stripeSubscription.id);
      return;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: stripeSubscription.status,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAt: stripeSubscription.cancel_at 
          ? new Date(stripeSubscription.cancel_at * 1000) 
          : null,
      },
    });
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubId: stripeSubscription.id },
    });

    if (!subscription) {
      return;
    }

    // Downgrade to free trial
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        tier: SubscriptionTier.FREE_TRIAL,
        status: 'canceled',
        stripeSubId: null,
      },
    });
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!subscription) {
      return;
    }

    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        status: 'paid',
        paidAt: new Date(),
        dueDate: new Date(invoice.due_date! * 1000),
      },
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!subscription) {
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'past_due' },
    });

    // Send payment failed email
    const business = await prisma.business.findUnique({
      where: { id: subscription.businessId },
      include: { owner: true },
    });

    if (business) {
      await emailService.sendEmail({
        to: business.owner.email,
        subject: 'Payment Failed - Action Required',
        html: `
          <h2>Payment Failed</h2>
          <p>We were unable to process your payment for AdvisorAI Hub.</p>
          <p>Please update your payment method to continue using our services.</p>
          <p><a href="${process.env.FRONTEND_URL}/dashboard/billing">Update Payment Method</a></p>
        `,
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(businessId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    if (!subscription?.stripeSubId) {
      throw new AppError('No active subscription found', 404);
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: true,
    });

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubId);

    await prisma.subscription.update({
      where: { businessId },
      data: {
        cancelAt: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    return {
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: new Date(stripeSubscription.current_period_end * 1000),
    };
  }

  /**
   * Get available plans
   */
  async getPlans() {
    return Object.entries(TIER_PRICING).map(([tier, price]) => ({
      tier,
      price,
      name: tier.replace(/_/g, ' '),
      limits: MODULE_LIMITS[tier as keyof typeof MODULE_LIMITS],
      features: this.getTierFeatures(tier as SubscriptionTier),
    }));
  }

  /**
   * Get tier features
   */
  private getTierFeatures(tier: SubscriptionTier): string[] {
    const features = {
      [SubscriptionTier.FREE_TRIAL]: [
        '14-day free trial',
        '50 AI generations/month',
        '1 business',
        '2 integrations',
        'Basic support',
      ],
      [SubscriptionTier.SMB_BASIC]: [
        '500 AI generations/month',
        '1 business',
        '3 integrations',
        'Email support',
        'All AI modules',
      ],
      [SubscriptionTier.SMB_PRO]: [
        '2,000 AI generations/month',
        '1 business',
        'Unlimited integrations',
        'Priority support',
        'Advanced analytics',
      ],
      [SubscriptionTier.ADVISOR_BASIC]: [
        '1,000 AI generations/month',
        'Up to 10 businesses',
        '5 integrations per business',
        'Advisor dashboard',
        'Client management',
      ],
      [SubscriptionTier.ADVISOR_PRO]: [
        '5,000 AI generations/month',
        'Up to 50 businesses',
        'Unlimited integrations',
        'White-label options',
        'Dedicated support',
      ],
    };

    return features[tier] || [];
  }
}

export const subscriptionService = new SubscriptionService();

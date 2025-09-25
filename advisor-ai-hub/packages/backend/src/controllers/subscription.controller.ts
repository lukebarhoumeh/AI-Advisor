import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionTier } from '@advisor-ai/shared';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const upgradeSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
  businessId: z.string(),
});

export class SubscriptionController {
  /**
   * Get current subscription
   */
  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const subscription = await subscriptionService.getSubscription(businessId);

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available plans
   */
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await subscriptionService.getPlans();

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create checkout session for upgrade
   */
  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = upgradeSchema.parse(req.body);

      const result = await subscriptionService.createCheckoutSession(
        validatedData.businessId,
        validatedData.tier,
        req.user!.email
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create billing portal session
   */
  async createPortal(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const result = await subscriptionService.createPortalSession(businessId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const result = await subscriptionService.cancelSubscription(businessId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      await subscriptionService.handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const subscription = await subscriptionService.getSubscription(businessId);

      res.json({
        success: true,
        data: {
          invoices: subscription.invoices,
          currentPlan: {
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAt: subscription.cancelAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check subscription status
   */
  async checkStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.query;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.json({
          success: true,
          data: { status: 'unknown' },
        });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      res.json({
        success: true,
        data: {
          status: session.payment_status,
          customerEmail: session.customer_email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();

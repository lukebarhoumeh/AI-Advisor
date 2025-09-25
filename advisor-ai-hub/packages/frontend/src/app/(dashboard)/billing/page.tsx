'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/services/api'
import { useBusinessStore } from '@/store'
import { SubscriptionTier, TIER_PRICING, formatCurrency, formatDate } from '@advisor-ai/shared'
import { CreditCard, Check, X, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BillingPage() {
  const { currentBusiness } = useBusinessStore()
  const searchParams = useSearchParams()
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)

  // Check for success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    if (success && sessionId) {
      // Verify payment success
      apiClient.request('get', `/subscriptions/check-status?sessionId=${sessionId}`)
        .then(() => {
          // Show success message (you could use a toast here)
          console.log('Payment successful!')
        })
    }
  }, [searchParams])

  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) return null
      const response = await apiClient.request('get', `/subscriptions/${currentBusiness.id}`)
      return response.data
    },
    enabled: !!currentBusiness,
  })

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await apiClient.request('get', '/subscriptions/plans')
      return response.data
    },
  })

  const createCheckoutMutation = useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      if (!currentBusiness) throw new Error('No business selected')
      
      const response = await apiClient.request('post', '/subscriptions/checkout', {
        businessId: currentBusiness.id,
        tier,
      })
      return response.data
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    },
  })

  const createPortalMutation = useMutation({
    mutationFn: async () => {
      if (!currentBusiness) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/subscriptions/${currentBusiness.id}/portal`)
      return response.data
    },
    onSuccess: (data) => {
      // Redirect to Stripe Portal
      if (data.portalUrl) {
        window.location.href = data.portalUrl
      }
    },
  })

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!currentBusiness) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/subscriptions/${currentBusiness.id}/cancel`)
      return response.data
    },
    onSuccess: () => {
      refetchSubscription()
    },
  })

  const currentTier = subscription?.tier || SubscriptionTier.FREE_TRIAL
  const isFreeTrial = currentTier === SubscriptionTier.FREE_TRIAL

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing information
          </p>
        </div>
        {!isFreeTrial && (
          <Button
            variant="outline"
            onClick={() => createPortalMutation.mutate()}
            disabled={createPortalMutation.isPending}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        )}
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your subscription details and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {currentTier.replace(/_/g, ' ')}
              </h3>
              <p className="text-muted-foreground">
                {isFreeTrial 
                  ? `Free trial ends ${formatDate(subscription?.currentPeriodEnd || new Date())}`
                  : `${formatCurrency(TIER_PRICING[currentTier as keyof typeof TIER_PRICING])}/month`
                }
              </p>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              subscription?.status === 'active' 
                ? 'bg-green-100 text-green-700'
                : subscription?.status === 'past_due'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            )}>
              {subscription?.status || 'inactive'}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>AI Generations</span>
                <span>
                  {subscription?.usage?.aiGenerations || 0} / {
                    subscription?.usage?.aiGenerationsLimit === -1 
                      ? 'Unlimited' 
                      : subscription?.usage?.aiGenerationsLimit || 0
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(subscription?.usage?.aiGenerationsPercentage || 0, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          {subscription?.cancelAt && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">
                Your subscription will end on {formatDate(subscription.cancelAt)}
              </p>
            </div>
          )}
        </CardContent>
        {!isFreeTrial && !subscription?.cancelAt && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  cancelSubscriptionMutation.mutate()
                }
              }}
              disabled={cancelSubscriptionMutation.isPending}
            >
              Cancel Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">
          {isFreeTrial ? 'Choose Your Plan' : 'Available Plans'}
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans?.filter((plan: any) => 
            plan.tier !== SubscriptionTier.FREE_TRIAL &&
            !plan.tier.includes('ADVISOR') // Hide advisor plans for SMB owners
          ).map((plan: any) => {
            const isCurrentPlan = plan.tier === currentTier
            const isDowngrade = TIER_PRICING[plan.tier as keyof typeof TIER_PRICING] < 
              TIER_PRICING[currentTier as keyof typeof TIER_PRICING]

            return (
              <Card
                key={plan.tier}
                className={cn(
                  'relative',
                  isCurrentPlan && 'border-primary'
                )}
              >
                {plan.tier === SubscriptionTier.SMB_PRO && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => createPortalMutation.mutate()}
                    >
                      Contact Support
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => createCheckoutMutation.mutate(plan.tier)}
                      disabled={createCheckoutMutation.isPending}
                    >
                      {createCheckoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      {subscription?.invoices && subscription.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Your recent invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription.invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(invoice.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'text-sm font-medium',
                      invoice.status === 'paid' 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    )}>
                      {invoice.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

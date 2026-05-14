// src/lib/stripe/client.ts
// Stripe client singleton + billing helpers.

import Stripe from 'stripe'
import { Plan } from '@prisma/client'
import { PLAN_CONFIG } from '@/types'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// ── Subscription helpers ──────────────────────────────────────────────────────

/** Map our Plan enum to the Stripe Price ID from env */
export const STRIPE_PRICE_IDS: Partial<Record<Plan, string>> = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? '',
  PRO: process.env.STRIPE_PRICE_PRO ?? '',
}

/** Create or retrieve a Stripe customer for a business */
export async function getOrCreateStripeCustomer(
  businessId: string,
  businessName: string,
  email: string,
  existingStripeCustomerId?: string | null
): Promise<string> {
  if (existingStripeCustomerId) return existingStripeCustomerId

  const customer = await stripe.customers.create({
    name: businessName,
    email,
    metadata: { businessId },
  })

  return customer.id
}

/**
 * Upgrade or downgrade a subscription.
 * - If no existing subscription: create via Checkout
 * - If subscription exists: update it in place with proration (Stripe handles the maths)
 * This prevents multiple concurrent subscriptions.
 */
export async function createOrUpdateSubscription(
  stripeCustomerId: string,
  existingStripeSubId: string | null | undefined,
  plan: 'STARTER' | 'PRO',
  returnUrl: string
): Promise<string> {
  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) throw new Error(`No Stripe price ID configured for plan: ${plan}`)

  // If there's an existing subscription, update it in place with proration
  if (existingStripeSubId) {
    const sub = await stripe.subscriptions.retrieve(existingStripeSubId)

    if (sub.status !== 'canceled') {
      const existingItemId = sub.items.data[0]?.id
      if (!existingItemId) throw new Error('No subscription item found')

      // Update the subscription — Stripe automatically calculates proration credit
      await stripe.subscriptions.update(existingStripeSubId, {
        items: [{ id: existingItemId, price: priceId }],
        proration_behavior: 'create_prorations',
      })

      // Return to billing page directly — no checkout needed
      return `${returnUrl}?upgrade=success`
    }
  }

  // No existing subscription — create via Checkout
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?upgrade=success`,
    cancel_url:  `${returnUrl}?upgrade=cancelled`,
    subscription_data: {
      // Ensure only one subscription per customer
      metadata: { appti_managed: 'true' },
    },
  })

  return session.url ?? returnUrl
}

/** Create a Stripe checkout session for a new subscription (legacy — use createOrUpdateSubscription) */
export async function createCheckoutSession(
  stripeCustomerId: string,
  plan: 'STARTER' | 'PRO',
  returnUrl: string
): Promise<string> {
  return createOrUpdateSubscription(stripeCustomerId, null, plan, returnUrl)
}

/** Create a Stripe billing portal session (manage/cancel subscription) */
export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}

/** Add a credit top-up (one-time payment) to a business */
export async function createCreditTopupSession(
  stripeCustomerId: string,
  amountAud: number,
  returnUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: { name: 'Message Credits' },
          unit_amount: Math.round(amountAud * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?topup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${returnUrl}?topup=cancelled`,
    metadata: { type: 'credit_topup', amountAud: amountAud.toString() },
  })

  return session.url ?? returnUrl
}

/** Get the rate for a given plan and channel */
export function getRateForPlan(plan: Plan, channel: 'sms' | 'email'): number {
  const config = PLAN_CONFIG[plan]
  return channel === 'sms' ? config.smsRate : config.emailRate
}

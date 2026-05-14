// src/app/api/webhooks/stripe/route.ts
// Stripe sends events here for subscription changes and completed payments.

import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Read as ArrayBuffer then convert to string to preserve exact bytes
  const buf    = await req.arrayBuffer()
  const body   = Buffer.from(buf).toString('utf8')
  const signature = req.headers.get('stripe-signature')

  console.log('[Stripe webhook] Received request, body length:', body.length, 'signature present:', !!signature)

  if (!signature) return apiError('Missing stripe-signature header', 400)

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  console.log('[Stripe webhook] Secret prefix:', webhookSecret.slice(0, 10))

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return apiError('Invalid webhook signature', 400)
  }

  console.log(`[Stripe webhook] Event type: ${event.type}`)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const plan       = getPlanFromSubscription(sub)
      console.log('[Stripe webhook] Subscription event, customer:', customerId)
      console.log('[Stripe webhook] Subscription status:', sub.status)
      console.log('[Stripe webhook] Subscription price ID:', sub.items.data[0]?.price.id)
      console.log('[Stripe webhook] STARTER price env:', process.env.STRIPE_PRICE_STARTER)
      console.log('[Stripe webhook] PRO price env:', process.env.STRIPE_PRICE_PRO)
      console.log('[Stripe webhook] Resolved plan:', plan)

      if (!plan) {
        console.log('[Stripe webhook] Plan not matched — check STRIPE_PRICE_STARTER/PRO env vars')
        break
      }

      // Only update for active subscriptions
      if (sub.status !== 'active' && sub.status !== 'trialing') {
        console.log('[Stripe webhook] Subscription not active, skipping plan update. Status:', sub.status)
        break
      }

      const updated = await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          plan,
          stripeSubId:  sub.id,
          planRenewsAt: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : (sub as any).billing_cycle_anchor
              ? new Date(((sub as any).billing_cycle_anchor + 2592000) * 1000)
              : null,
        },
      })
      console.log('[Stripe webhook] Plan updated to', plan, '— rows affected:', updated.count)
      break
    }

    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'PAYG', stripeSubId: null, planRenewsAt: null },
      })
      break
    }

    case 'checkout.session.completed': {
      // Retrieve the full session to ensure metadata is populated
      const sessionId = (event.data.object as Stripe.Checkout.Session).id
      const session   = await stripe.checkout.sessions.retrieve(sessionId)
      const customerId = session.customer as string
      const metadata   = session.metadata ?? {}

      console.log('[Stripe webhook] Checkout completed, session id:', sessionId)
      console.log('[Stripe webhook] Metadata:', metadata)
      console.log('[Stripe webhook] Customer ID:', customerId)

      if (metadata.type !== 'credit_topup') {
        console.log('[Stripe webhook] Not a credit topup, skipping')
        break
      }

      const amountAud = Number(metadata.amountAud ?? 0)
      console.log('[Stripe webhook] Top-up amount AUD:', amountAud)

      if (!amountAud || !customerId) {
        console.error('[Stripe webhook] Missing amount or customer ID')
        break
      }

      const updated = await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data:  { creditBalance: { increment: amountAud } },
      })

      console.log('[Stripe webhook] Credit balance updated, rows affected:', updated.count)
      break
    }

    default:
      console.log(`[Stripe webhook] Unhandled event type: ${event.type}`)
  }

  return apiSuccess({ received: true })
}

function getPlanFromSubscription(sub: Stripe.Subscription): 'STARTER' | 'PRO' | null {
  const priceId = sub.items.data[0]?.price.id
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'STARTER'
  if (priceId === process.env.STRIPE_PRICE_PRO)     return 'PRO'
  return null
}

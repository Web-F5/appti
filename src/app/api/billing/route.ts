// src/app/api/billing/route.ts
// POST /api/billing — create a Stripe checkout session for credit top-up or plan upgrade
// POST /api/billing/portal — create a Stripe billing portal session

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import {
  getOrCreateStripeCustomer,
  createOrUpdateSubscription,
  createCreditTopupSession,
  createBillingPortalSession,
} from '@/lib/stripe/client'
import { z } from 'zod'

const Schema = z.discriminatedUnion('action', [
  z.object({
    action:    z.literal('topup'),
    amountAud: z.number().min(10).max(500),
  }),
  z.object({
    action: z.literal('upgrade'),
    plan:   z.enum(['STARTER', 'PRO']),
  }),
  z.object({
    action: z.literal('portal'),
  }),
])

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessSlug) return apiError('Unauthorised', 401)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  // Load business
  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    select: {
      id: true, name: true, slug: true,
      stripeCustomerId: true, stripeSubId: true, plan: true,
    },
  })
  if (!business) return apiError('Business not found', 404)

  // Get the logged-in user's email for Stripe customer
  const user = await prisma.user.findFirst({
    where: { businessId: business.id },
    select: { email: true },
  })
  if (!user) return apiError('User not found', 404)

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const returnUrl = `${appUrl}/billing`

  // Ensure Stripe customer exists
  const stripeCustomerId = await getOrCreateStripeCustomer(
    business.id,
    business.name,
    user.email,
    business.stripeCustomerId
  )

  // Store customer ID if newly created
  if (!business.stripeCustomerId) {
    await prisma.business.update({
      where: { id: business.id },
      data:  { stripeCustomerId },
    })
  }

  try {
    const data = parsed.data

    if (data.action === 'topup') {
      const url = await createCreditTopupSession(
        stripeCustomerId,
        data.amountAud,
        returnUrl
      )
      return apiSuccess({ url })
    }

    if (data.action === 'upgrade') {
      const url = await createOrUpdateSubscription(
        stripeCustomerId,
        business.stripeSubId,
        data.plan,
        returnUrl
      )
      return apiSuccess({ url })
    }

    if (data.action === 'portal') {
      const url = await createBillingPortalSession(
        stripeCustomerId,
        returnUrl
      )
      return apiSuccess({ url })
    }
  } catch (err) {
    console.error('[billing] Stripe error:', err)
    return apiError('Failed to create billing session', 500)
  }

  return apiError('Unknown action', 400)
}

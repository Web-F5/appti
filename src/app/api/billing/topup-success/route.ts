// src/app/api/billing/topup-success/route.ts
// Called when Stripe redirects back after a successful top-up payment.
// Verifies the session with Stripe and updates the credit balance directly.
// This is a fallback for when the webhook is delayed or misconfigured.

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe/client'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessSlug) return apiError('Unauthorised', 401)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const { sessionId } = body as { sessionId?: string }
  if (!sessionId) return apiError('Missing sessionId', 400)

  // Retrieve the session from Stripe to verify payment
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

  if (checkoutSession.payment_status !== 'paid') {
    return apiError('Payment not completed', 400)
  }

  if (checkoutSession.metadata?.type !== 'credit_topup') {
    return apiError('Not a credit top-up session', 400)
  }

  const amountAud = Number(checkoutSession.metadata?.amountAud ?? 0)
  if (!amountAud) return apiError('Invalid amount', 400)

  // Find business by customer ID to verify ownership
  const business = await prisma.business.findFirst({
    where: {
      slug: session.user.businessSlug,
      stripeCustomerId: checkoutSession.customer as string,
    },
    select: { id: true },
  })

  if (!business) return apiError('Business not found', 404)

  // Check if this session has already been processed (idempotency)
  const alreadyProcessed = await prisma.usageEvent.findFirst({
    where: {
      businessId: business.id,
      eventType: 'CREDIT_ADDED' as any,
      stripeUsageRecordId: sessionId,
    },
  })

  if (alreadyProcessed) {
    return apiSuccess({ message: 'Already processed', credited: amountAud })
  }

  // Update credit balance
  await prisma.business.update({
    where: { id: business.id },
    data:  { creditBalance: { increment: amountAud } },
  })

  console.log(`[topup-success] Credited $${amountAud} to business ${business.id} via session ${sessionId}`)

  return apiSuccess({ message: 'Credits added', credited: amountAud })
}

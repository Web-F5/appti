// src/app/(dashboard)/billing/page.tsx
import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { PLAN_CONFIG } from '@/types'
import BillingClient from '@/components/dashboard/BillingClient'

export const metadata: Metadata = { title: 'Billing' }

type Props = { searchParams: Promise<{ topup?: string; upgrade?: string }> }

export default async function BillingPage({ searchParams }: Props) {
  const session = await requireSession()
  const params  = await searchParams

  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    select: {
      id: true, name: true, slug: true,
      plan: true, creditBalance: true,
      planRenewsAt: true, stripeCustomerId: true,
    },
  })
  if (!business) return <div style={{ color: 'var(--text-muted)' }}>Business not found.</div>

  const recentUsage = await prisma.usageEvent.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const now        = new Date()
  // Use billing cycle start (planRenewsAt - 1 month) or calendar month for PAYG
  const cycleStart = business.planRenewsAt
    ? (() => { const d = new Date(business.planRenewsAt!); d.setMonth(d.getMonth() - 1); return d })()
    : new Date(now.getFullYear(), now.getMonth(), 1)

  const monthUsage  = recentUsage.filter(e => e.createdAt >= cycleStart)
  const smsMonth    = monthUsage.filter(e => e.eventType === 'SMS_SENT').length
  const emailMonth  = monthUsage.filter(e => e.eventType === 'EMAIL_SENT').length
  const spendMonth  = monthUsage.reduce((s, e) => s + Number(e.cost), 0)

  const serialised = {
    ...business,
    creditBalance: Number(business.creditBalance),
    planRenewsAt:  business.planRenewsAt?.toISOString() ?? null,
  }

  const usageRows = recentUsage.map(e => ({
    id:        e.id,
    eventType: e.eventType,
    cost:      Number(e.cost),
    createdAt: e.createdAt.toISOString(),
  }))

  // Success/cancelled banners based on return from Stripe
  const topupSuccess   = params.topup   === 'success'
  const upgradeSuccess = params.upgrade === 'success'
  const cancelled      = params.topup   === 'cancelled' || params.upgrade === 'cancelled'

  return (
    <div>
      {topupSuccess && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#D1FAE5', border: '0.5px solid #6EE7B7', fontSize: 14, color: '#065F46', fontWeight: 500 }}>
          ✓ Credits added to your balance successfully.
        </div>
      )}
      {upgradeSuccess && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'var(--purple-light)', border: '0.5px solid var(--border)', fontSize: 14, color: 'var(--purple-dark)', fontWeight: 500 }}>
          ✓ Plan upgraded successfully. Your new plan is now active.
        </div>
      )}
      {cancelled && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#FEF3C7', border: '0.5px solid #FCD34D', fontSize: 14, color: '#92400E' }}>
          Payment was cancelled — no charge was made.
        </div>
      )}

      <BillingClient
        business={serialised}
        planConfig={PLAN_CONFIG}
        usageRows={usageRows}
        monthStats={{ sms: smsMonth, email: emailMonth, spend: spendMonth }}
      />
    </div>
  )
}

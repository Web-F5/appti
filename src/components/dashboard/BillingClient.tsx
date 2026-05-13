'use client'
// src/components/dashboard/BillingClient.tsx

import { useState } from 'react'
import type { PLAN_CONFIG } from '@/types'

type Props = {
  business: {
    id:               string
    slug:             string
    plan:             string
    creditBalance:    number
    planRenewsAt:     string | null
    stripeCustomerId: string | null
  }
  planConfig:  typeof PLAN_CONFIG
  usageRows:   { id: string; eventType: string; cost: number; createdAt: string }[]
  monthStats:  { sms: number; email: number; spend: number }
}

function PlanCard({ planKey, config, current, currentPlan, onUpgrade, onManage, loading }: {
  planKey:     string
  config:      any
  current:     boolean
  currentPlan: string
  onUpgrade:   (plan: string) => void
  onManage:    () => void
  loading:     boolean
}) {
  const isPAYG    = planKey === 'PAYG'
  const planOrder = { PAYG: 0, STARTER: 1, PRO: 2 }
  const isLower   = (planOrder[planKey as keyof typeof planOrder] ?? 0) < (planOrder[currentPlan as keyof typeof planOrder] ?? 0)
  const isHigher  = (planOrder[planKey as keyof typeof planOrder] ?? 0) > (planOrder[currentPlan as keyof typeof planOrder] ?? 0)

  return (
    <div style={{
      borderRadius: 16,
      padding: 24,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 16,
      border: current ? '2px solid var(--purple-mid)' : '0.5px solid var(--border)',
      background: current ? 'var(--purple-light)' : 'var(--white)',
      position: 'relative' as const,
    }}>
      {current && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--purple-dark)', color: 'white',
          fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
        }}>
          Current plan
        </div>
      )}

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{planKey}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-dark)' }}>
            {config.monthlyFee === 0 ? '$0' : `$${config.monthlyFee}`}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ month</span>
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {[
          { label: 'Included SMS',   value: config.includedSms > 0   ? `${config.includedSms}/mo`   : 'None — PAYG only' },
          { label: 'Included email', value: config.includedEmail > 0 ? `${config.includedEmail}/mo` : 'None — PAYG only' },
          { label: 'SMS rate',       value: `$${config.smsRate.toFixed(3)} each`  },
          { label: 'Email rate',     value: `$${config.emailRate.toFixed(4)} each` },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {current && !isPAYG && (
        <button onClick={onManage} disabled={loading}
          style={{ marginTop: 'auto', width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--purple-dark)', border: '1.5px solid var(--purple-mid)' }}>
          Manage subscription →
        </button>
      )}

      {!current && isHigher && (
        <button onClick={() => onUpgrade(planKey)} disabled={loading} className="btn-primary"
          style={{ marginTop: 'auto', width: '100%', color: 'white', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Redirecting…' : `Upgrade to ${planKey}`}
        </button>
      )}

      {!current && isLower && (
        <button onClick={isPAYG ? onManage : () => onUpgrade(planKey)} disabled={loading}
          style={{ marginTop: 'auto', width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
          {loading ? 'Redirecting…' : `Downgrade to ${planKey}`}
        </button>
      )}
    </div>
  )
}

const TOPUP_AMOUNTS = [10, 25, 50, 100, 200]

function TopUpModal({ onClose, onTopUp, loading }: {
  onClose: () => void
  onTopUp: (amount: number) => void
  loading: boolean
}) {
  const [amount, setAmount] = useState(25)
  const [custom, setCustom] = useState('')
  const finalAmount = custom ? Number(custom) : amount

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: 'var(--white)', borderRadius: 20, width: '100%', maxWidth: 380, padding: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-dark)', marginBottom: 4 }}>Top up credits</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Credits are used to send SMS and email reminders. They never expire.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {TOPUP_AMOUNTS.map(a => (
            <button key={a} onClick={() => { setAmount(a); setCustom('') }}
              style={{
                padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: amount === a && !custom ? 'var(--purple-dark)' : 'var(--white)',
                color: amount === a && !custom ? 'white' : 'var(--text-dark)',
                border: amount === a && !custom ? 'none' : '0.5px solid var(--border-strong)',
              }}
            >
              ${a}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
            Custom amount (AUD, min $10)
          </label>
          <input
            type="number" min={10} max={500} value={custom}
            onChange={e => { setCustom(e.target.value); setAmount(0) }}
            placeholder="e.g. 75"
            className="input"
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onTopUp(finalAmount)}
            disabled={loading || finalAmount < 10}
            className="btn-primary"
            style={{ flex: 1, color: 'white', opacity: loading || finalAmount < 10 ? 0.5 : 1 }}
          >
            {loading ? 'Redirecting…' : `Pay $${finalAmount} AUD`}
          </button>
          <button onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}
          >
            Cancel
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
          Secured by Stripe · Credits added instantly on payment
        </p>
      </div>
    </div>
  )
}

export default function BillingClient({ business, planConfig, usageRows, monthStats }: Props) {
  const [showTopUp,     setShowTopUp]     = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function callBilling(body: object, loadingKey: string) {
    setLoading(true)
    setActionLoading(loadingKey)
    try {
      const res  = await fetch('/api/billing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      console.log('[Billing] Response:', data)
      if (!res.ok || !data.data?.url) { alert(data.error ?? 'Something went wrong'); return }
      console.log('[Billing] Redirecting to:', data.data.url)
      window.location.href = data.data.url
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleUpgrade = (plan: string) => callBilling({ action: 'upgrade', plan }, `upgrade-${plan}`)
  const handleTopUp   = (amount: number) => { setShowTopUp(false); callBilling({ action: 'topup', amountAud: amount }, 'topup') }
  const handlePortal  = () => callBilling({ action: 'portal' }, 'portal')

  const lowBalance = business.creditBalance < 2

  return (
    <div>
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} onTopUp={handleTopUp} loading={actionLoading === 'topup'} />}

      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-dark)' }}>Billing</h1>

      {/* Balance + month stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div style={{
          gridColumn: 'span 1',
          borderRadius: 16, padding: 20,
          background: lowBalance ? '#FEF2F2' : 'var(--purple-dark)',
          border: lowBalance ? '0.5px solid #FCA5A5' : 'none',
        }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: lowBalance ? '#DC2626' : 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Credit balance</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: lowBalance ? '#DC2626' : 'white', marginBottom: 4 }}>
            ${business.creditBalance.toFixed(2)}
          </p>
          {lowBalance && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>⚠ Low balance</p>}
          {!lowBalance && <p style={{ fontSize: 11, color: 'var(--blue-light)', marginBottom: 12 }}>{business.plan} plan</p>}
          <button
            onClick={() => setShowTopUp(true)}
            disabled={loading}
            className="btn-primary"
            style={{ fontSize: 12, padding: '7px 14px', color: 'white' }}
          >
            Top up
          </button>
        </div>

        {[
          { label: 'SMS this month',    value: monthStats.sms,   icon: '📱' },
          { label: 'Emails this month', value: monthStats.email, icon: '✉️' },
          { label: 'Spend this month',  value: `$${monthStats.spend.toFixed(4)}`, icon: '💳' },
        ].map(stat => (
          <div key={stat.label} className="card p-5 text-center">
            <p style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-dark)' }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Bundle usage for paid plans */}
      {business.plan !== 'PAYG' && (() => {
        const config = planConfig[business.plan as keyof typeof planConfig]
        return (
          <div className="card p-5 mb-8">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 16 }}>
              Bundle usage this cycle
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'SMS', used: monthStats.sms, total: config.includedSms, color: 'var(--blue-light)' },
                { label: 'Email', used: monthStats.email, total: config.includedEmail, color: 'var(--purple-mid)' },
              ].map(item => {
                const pct     = Math.min((item.used / item.total) * 100, 100)
                const over    = item.used > item.total
                const remaining = Math.max(item.total - item.used, 0)
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: over ? '#DC2626' : 'var(--text-muted)' }}>
                        {item.used} / {item.total}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, transition: 'width 0.3s',
                        width: `${pct}%`,
                        background: over ? '#DC2626' : item.color,
                      }}/>
                    </div>
                    <p style={{ fontSize: 11, color: over ? '#DC2626' : 'var(--text-muted)', marginTop: 4 }}>
                      {over
                        ? `${item.used - item.total} over bundle — charged at overage rate`
                        : `${remaining} remaining — free to send`}
                    </p>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
              Messages within your bundle are free. Overage is charged at ${planConfig[business.plan as keyof typeof planConfig]?.smsRate.toFixed(3)}/SMS and ${planConfig[business.plan as keyof typeof planConfig]?.emailRate.toFixed(4)}/email from your credit balance.
            </p>
          </div>
        )
      })()}
      {business.plan !== 'PAYG' && business.planRenewsAt && (
        <div className="card p-4 mb-6 flex items-center justify-between">
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{business.plan} plan</span>
            {' '}renews on{' '}
            {new Date(business.planRenewsAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <button
            onClick={handlePortal}
            disabled={loading}
            style={{ fontSize: 13, color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Manage subscription →
          </button>
        </div>
      )}

      {/* Plan cards */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 16 }}>Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(planConfig).map(([key, config]) => (
          <PlanCard
            key={key}
            planKey={key}
            config={config}
            current={business.plan === key}
            currentPlan={business.plan}
            onUpgrade={handleUpgrade}
            onManage={handlePortal}
            loading={actionLoading === `upgrade-${key}`}
          />
        ))}
      </div>

      {/* Usage history */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 16 }}>Usage history</h2>
      <div className="card overflow-hidden">
        {usageRows.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            No usage recorded yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--surface)' }}>
                {['Type', 'Cost', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 20px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usageRows.map(event => (
                <tr key={event.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: event.eventType === 'SMS_SENT' ? '#185FA5' : event.eventType === 'EMAIL_SENT' ? '#065F46' : '#DC2626' }}>
                      {event.eventType === 'SMS_SENT' ? '📱 ' : event.eventType === 'EMAIL_SENT' ? '✉️ ' : '⚠️ '}
                      {event.eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 500, color: 'var(--text-dark)' }}>
                    ${event.cost.toFixed(4)}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(event.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

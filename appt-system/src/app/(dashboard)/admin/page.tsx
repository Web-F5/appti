'use client'
// src/app/(dashboard)/admin/page.tsx
// System health dashboard — only accessible to account owners.
// Shows real-time status of all critical services.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { HealthReport, ServiceStatus } from '@/app/api/health/route'

// ── Status indicator ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors = { ok: '#10B981', warn: '#F59E0B', error: '#EF4444' }
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: colors[status],
      boxShadow: status === 'error' ? `0 0 0 3px rgba(239,68,68,0.2)` : status === 'warn' ? `0 0 0 3px rgba(245,158,11,0.2)` : 'none',
    }}/>
  )
}

function StatusBadge({ status, label }: { status: ServiceStatus; label?: string }) {
  const config = {
    ok:    { bg: '#D1FAE5', color: '#065F46', text: label ?? 'Operational' },
    warn:  { bg: '#FEF3C7', color: '#92400E', text: label ?? 'Warning'     },
    error: { bg: '#FEE2E2', color: '#991B1B', text: label ?? 'Error'       },
  }[status]
  return (
    <span style={{ background: config.bg, color: config.color, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
      {config.text}
    </span>
  )
}

// ── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({ name, icon, svc }: {
  name: string
  icon: string
  svc:  { status: ServiceStatus; latencyMs?: number; minutesSince?: number; waiting?: number; failed?: number; lastHeartbeat?: string; error?: string }
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{name}</span>
        </div>
        <StatusDot status={svc.status}/>
      </div>
      <StatusBadge status={svc.status}/>
      <div className="mt-3 space-y-1">
        {'latencyMs' in svc && svc.latencyMs !== undefined && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Latency: {svc.latencyMs}ms</p>
        )}
        {'minutesSince' in svc && svc.minutesSince !== undefined && (
          <p className="text-xs" style={{ color: svc.minutesSince > 8 ? '#DC2626' : 'var(--text-muted)' }}>
            Last heartbeat: {svc.minutesSince === 0 ? 'just now' : `${svc.minutesSince} min ago`}
          </p>
        )}
        {'lastHeartbeat' in svc && svc.lastHeartbeat && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date(svc.lastHeartbeat).toLocaleTimeString('en-AU')}
          </p>
        )}
        {'waiting' in svc && svc.waiting !== undefined && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Queued: {svc.waiting}</p>
        )}
        {'failed' in svc && svc.failed !== undefined && svc.failed > 0 && (
          <p className="text-xs font-semibold" style={{ color: '#DC2626' }}>Failed jobs: {svc.failed}</p>
        )}
        {'error' in svc && svc.error && (
          <p className="text-xs" style={{ color: '#DC2626', wordBreak: 'break-word' }}>{svc.error}</p>
        )}
      </div>
    </div>
  )
}

// ── Alert email manager ───────────────────────────────────────────────────────

function AlertEmailManager() {
  const [emails, setEmails]     = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.data?.alertEmails) setEmails(d.data.alertEmails)
    })
  }, [])

  function addEmail() {
    if (!newEmail.trim() || emails.includes(newEmail.trim())) return
    setEmails(prev => [...prev, newEmail.trim()])
    setNewEmail('')
  }

  function removeEmail(email: string) {
    setEmails(prev => prev.filter(e => e !== email))
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-dark)' }}>Alert recipients</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        These email addresses receive system alerts when a service goes down or the worker stops responding.
        Update <code className="text-xs bg-gray-100 px-1 rounded">ADMIN_ALERT_EMAILS</code> in your environment variables to persist changes across deployments.
      </p>

      <div className="space-y-2 mb-4">
        {emails.map(email => (
          <div key={email} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--purple-soft)', border: '0.5px solid var(--border)' }}>
            <span className="text-sm font-mono" style={{ color: 'var(--text-dark)' }}>{email}</span>
            <button onClick={() => removeEmail(email)}
              className="text-xs px-2 py-1 rounded" style={{ color: '#DC2626' }}>
              Remove
            </button>
          </div>
        ))}
        {emails.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No alert recipients configured</p>
        )}
      </div>

      <div className="flex gap-2">
        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
          placeholder="admin@example.com" className="input flex-1 text-sm"
          onKeyDown={e => e.key === 'Enter' && addEmail()} />
        <button onClick={addEmail} className="btn-primary text-sm px-4" style={{ color: 'white' }}>
          Add
        </button>
      </div>

      {saved && <p className="text-xs mt-2 text-center" style={{ color: '#10B981' }}>✓ Remember to update ADMIN_ALERT_EMAILS in Vercel</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [report,    setReport]    = useState<HealthReport | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [sending,   setSending]   = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  const fetchHealth = useCallback(async () => {
    try {
      const res  = await fetch('/api/health')
      const data = await res.json() as HealthReport
      setReport(data)
      setLastCheck(new Date())
    } catch {
      // Keep previous report
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 60_000) // refresh every minute
    return () => clearInterval(interval)
  }, [fetchHealth])

  async function sendTestAlert() {
    if (!report) return
    setSending(true)
    try {
      await fetch('/api/admin/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      })
      setAlertSent(true)
      setTimeout(() => setAlertSent(false), 3000)
    } finally {
      setSending(false)
    }
  }

  const overallColor = report?.status === 'ok' ? '#10B981' : report?.status === 'warn' ? '#F59E0B' : '#EF4444'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>System Health</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {lastCheck ? `Last checked ${lastCheck.toLocaleTimeString('en-AU')} · Auto-refreshes every minute` : 'Checking…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchHealth} className="btn-secondary text-sm">
            Refresh now
          </button>
          <button onClick={sendTestAlert} disabled={sending || !report}
            className="btn-primary text-sm" style={{ color: 'white' }}>
            {sending ? 'Sending…' : alertSent ? '✓ Sent!' : 'Send test alert'}
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {report && (
        <div className="rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: overallColor + '18', border: `1.5px solid ${overallColor}40` }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: overallColor, flexShrink: 0 }}/>
          <div>
            <p className="font-bold" style={{ color: overallColor }}>
              {report.status === 'ok' ? 'All systems operational' : report.status === 'warn' ? 'Degraded performance detected' : 'Service disruption detected'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {new Date(report.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} AEST
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Checking services…</p>
        </div>
      )}

      {/* Service cards */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ServiceCard name="Database" icon="🗄️" svc={report.services.database}/>
          <ServiceCard name="Redis" icon="⚡" svc={report.services.redis}/>
          <ServiceCard name="Worker" icon="⚙️" svc={report.services.worker}/>
          <ServiceCard name="Queue" icon="📋" svc={report.services.queue}/>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert email manager */}
        <AlertEmailManager/>

        {/* Quick links and info */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-dark)' }}>External monitoring</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Use these URLs with an external uptime monitor (Better Uptime, UptimeRobot, or Freshping) for 24/7 alerting even if the dashboard is unreachable.
          </p>
          <div className="space-y-3">
            {[
              { label: 'Health endpoint (public)', url: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/health`, desc: 'Returns 200 when all services OK, 503 when degraded' },
              { label: 'Booking page', url: `${typeof window !== 'undefined' ? window.location.origin : ''}/book/demo-trades`, desc: 'Test that the public booking flow is accessible' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--purple-soft)', border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>{item.label}</p>
                <p className="text-xs font-mono mb-1 break-all" style={{ color: 'var(--purple-dark)' }}>{item.url}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>Worker status</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              The worker writes a heartbeat to Redis every 5 minutes. If no heartbeat is received for 10 minutes, the worker status shows as error.
              Deploy the worker to Railway before purchasing SMS credits.
            </p>
            <Link href="https://railway.app" target="_blank" className="text-xs mt-2 inline-block" style={{ color: 'var(--orange)' }}>
              Deploy worker to Railway →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

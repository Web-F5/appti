'use client'
// src/app/(secure-admin)/secure-admin/page.tsx
// Admin login + dashboard in one page.
// Credentials are set via ADMIN_USERNAME and ADMIN_PASSWORD env vars.
// Session stored in a signed cookie via /api/secure-admin/auth.

import { useState, useEffect } from 'react'
import type { HealthReport } from '@/app/api/health/route'

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceStatus = 'ok' | 'warn' | 'error'

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/secure-admin/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })
      if (res.ok) {
        onLogin()
      } else {
        setError('Invalid credentials')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0A1E', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#1A1035', borderRadius: 20, padding: 40, border: '0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Appti" style={{ height: 32, width: 'auto' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>Admin</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Restricted access</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '0.5px solid rgba(239,68,68,0.3)', color: '#FCA5A5', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShow(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {show
                    ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></>
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>}
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, background: '#E8845A', color: 'white', border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Status components ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ServiceStatus }) {
  const cfg = {
    ok:    { bg: 'rgba(16,185,129,0.15)', color: '#6EE7B7', label: 'OK'      },
    warn:  { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D', label: 'Warning' },
    error: { bg: 'rgba(239,68,68,0.15)',  color: '#FCA5A5', label: 'Error'   },
  }[status]
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
      {cfg.label}
    </span>
  )
}

function ServiceRow({ name, icon, svc }: {
  name: string; icon: string
  svc: { status: ServiceStatus; latencyMs?: number; minutesSince?: number; waiting?: number; failed?: number; lastHeartbeat?: string; error?: string }
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'white' }}>{name}</span>
      <StatusPill status={svc.status}/>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', minWidth: 160, textAlign: 'right' }}>
        {'latencyMs' in svc && svc.latencyMs ? `${svc.latencyMs}ms` : ''}
        {'minutesSince' in svc && svc.minutesSince !== undefined ? (svc.minutesSince === 0 ? 'just now' : `${svc.minutesSince}min ago`) : ''}
        {'failed' in svc && svc.failed ? `${svc.failed} failed` : ''}
        {'error' in svc && svc.error ? svc.error.slice(0, 40) : ''}
      </span>
    </div>
  )
}

// ── Alert email manager ───────────────────────────────────────────────────────

function AlertEmails() {
  const [emails,   setEmails]   = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.data?.alertEmails) setEmails(d.data.alertEmails)
    })
  }, [])

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white' }}>Alert recipients</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Update <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>ADMIN_ALERT_EMAILS</code> in Vercel to persist
        </p>
      </div>
      <div style={{ padding: '12px 20px' }}>
        {emails.map(e => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>{e}</span>
            <button onClick={() => setEmails(p => p.filter(x => x !== e))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', fontSize: 12 }}>Remove</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="new@example.com" onKeyDown={e => { if (e.key === 'Enter' && newEmail) { setEmails(p => [...p, newEmail]); setNewEmail('') } }}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 13, outline: 'none' }}
          />
          <button onClick={() => { if (newEmail) { setEmails(p => [...p, newEmail]); setNewEmail('') } }}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#E8845A', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [report,    setReport]    = useState<HealthReport | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [sending,   setSending]   = useState(false)
  const [alertSent, setAlertSent] = useState(false)

  const fetchHealth = async () => {
    try {
      const res  = await fetch('/api/health?full=1')
      const data = await res.json()
      setReport(data)
      setLastCheck(new Date())
    } catch { /* keep previous */ }
  }

  useEffect(() => {
    fetchHealth()
    const t = setInterval(fetchHealth, 60_000)
    return () => clearInterval(t)
  }, [])

  async function sendTestAlert() {
    if (!report) return
    setSending(true)
    try {
      await fetch('/api/admin/alert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      })
      setAlertSent(true)
      setTimeout(() => setAlertSent(false), 3000)
    } finally { setSending(false) }
  }

  async function logout() {
    await fetch('/api/secure-admin/auth', { method: 'DELETE' })
    onLogout()
  }

  const statusColor = report?.status === 'ok' ? '#10B981' : report?.status === 'warn' ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ minHeight: '100vh', background: '#0F0A1E', padding: 32 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'white' }}>System Health</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {lastCheck ? `Last checked ${lastCheck.toLocaleTimeString('en-AU')}` : 'Checking…'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchHealth}
              style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: 'white', border: '0.5px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
              Refresh
            </button>
            <button onClick={sendTestAlert} disabled={sending || !report}
              style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#E8845A', color: 'white', border: 'none', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Sending…' : alertSent ? '✓ Sent!' : 'Test alert'}
            </button>
            <button onClick={logout}
              style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, background: 'none', color: 'rgba(255,255,255,0.4)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Overall status */}
        {report && (
          <div style={{ borderRadius: 16, padding: '16px 24px', marginBottom: 24, background: statusColor + '18', border: `1.5px solid ${statusColor}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: statusColor, boxShadow: `0 0 0 4px ${statusColor}30` }}/>
            <p style={{ margin: 0, fontWeight: 700, color: statusColor }}>
              {report.status === 'ok' ? 'All systems operational' : report.status === 'warn' ? 'Degraded performance' : 'Service disruption detected'}
            </p>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {new Date(report.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} AEST
            </span>
          </div>
        )}

        {/* Services */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white' }}>Services</p>
          </div>
          {report ? (
            <>
              <ServiceRow name="Database (Neon)" icon="🗄️" svc={report.services.database}/>
              <ServiceRow name="Redis (Upstash)" icon="⚡" svc={report.services.redis}/>
              <ServiceRow name="Reminder Worker" icon="⚙️" svc={report.services.worker}/>
              <ServiceRow name="Job Queue" icon="📋" svc={report.services.queue}/>
            </>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
          )}
        </div>

        {/* Alert email manager */}
        <AlertEmails/>

        {/* External monitor URL */}
        <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'white' }}>External uptime monitor</p>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Add this URL to Better Uptime, UptimeRobot, or Freshping. Returns 200 when healthy, 503 when degraded.</p>
          <code style={{ fontSize: 12, color: '#60A5FA', background: 'rgba(96,165,250,0.1)', padding: '6px 12px', borderRadius: 8, display: 'block', wordBreak: 'break-all' }}>
            {typeof window !== 'undefined' ? window.location.origin : ''}/api/health
          </code>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecureAdminPage() {
  const [authed,  setAuthed]  = useState<boolean | null>(null) // null = checking

  useEffect(() => {
    fetch('/api/secure-admin/auth')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false))
  }, [])

  if (authed === null) return (
    <div style={{ minHeight: '100vh', background: '#0F0A1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #E8845A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />
  return <AdminDashboard onLogout={() => setAuthed(false)} />
}

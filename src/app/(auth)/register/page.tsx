'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/auth/PasswordInput'

const TIMEZONES = [
  { value: 'Australia/Sydney',    label: 'Sydney / Melbourne (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Australia/Brisbane',  label: 'Brisbane (no DST)' },
  { value: 'Australia/Adelaide',  label: 'Adelaide (ACST)' },
  { value: 'Australia/Perth',     label: 'Perth (AWST)' },
  { value: 'Australia/Darwin',    label: 'Darwin (ACST no DST)' },
  { value: 'Australia/Hobart',    label: 'Hobart (AEST)' },
  { value: 'Pacific/Auckland',    label: 'New Zealand (NZST)' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', businessName: '', timezone: 'Australia/Melbourne' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function patch(u: Partial<typeof form>) { setForm(p => ({ ...p, ...u })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, email: form.email, password: form.password, businessName: form.businessName, timezone: form.timezone }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Registration failed'); setLoading(false); return }
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      if (result?.error) { router.push('/login?registered=1'); return }
      router.push('/dashboard')
      router.refresh()
    } catch { setError('Network error — please try again'); setLoading(false) }
  }

  const inputClass = "input"
  const labelClass = "block text-sm font-medium mb-1.5"

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
      <div className="hidden lg:flex w-80 flex-col justify-between p-10" style={{ background: 'var(--purple-dark)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--orange)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="font-semibold text-white">{process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}</span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-white leading-snug mb-3">Get started in minutes</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Create your account and start taking bookings today. No subscription required.</p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 {process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-dark)' }}>Create your account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Get your booking system set up in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3.5 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '0.5px solid #FCA5A5' }}>{error}</div>}

            <div>
              <label className={labelClass} style={{ color: 'var(--text-dark)' }}>Your name <span style={{ color: 'var(--orange)' }}>*</span></label>
              <input type="text" value={form.name} onChange={e => patch({ name: e.target.value })} required placeholder="Jane Smith" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-dark)' }}>Email <span style={{ color: 'var(--orange)' }}>*</span></label>
              <input type="email" value={form.email} onChange={e => patch({ email: e.target.value })} required placeholder="jane@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-dark)' }}>Business name <span style={{ color: 'var(--orange)' }}>*</span></label>
              <input type="text" value={form.businessName} onChange={e => patch({ businessName: e.target.value })} required placeholder="Acme Trades" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-dark)' }}>Timezone</label>
              <select value={form.timezone} onChange={e => patch({ timezone: e.target.value })} className={inputClass}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>
            <PasswordInput id="password" label="Password" value={form.password}
              onChange={v => patch({ password: v })} required placeholder="Min. 8 characters" />
            <PasswordInput id="confirmPassword" label="Confirm password" value={form.confirmPassword}
              onChange={v => patch({ confirmPassword: v })} required />

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" style={{ color: 'white' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium" style={{ color: 'var(--orange)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

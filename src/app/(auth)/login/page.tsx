'use client'
'use client'
import { Suspense } from 'react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/auth/PasswordInput'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const registered  = searchParams.get('registered') === '1'

  const [email,   setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signIn('credentials', { email: email.trim(), password, redirect: false })
    if (result?.error) { setError('Invalid email or password'); setLoading(false); return }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-dark)' }}>Welcome back</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
      </div>

      {registered && (
        <div className="mb-4 p-3.5 rounded-xl text-sm" style={{ background: '#D1FAE5', color: '#065F46', border: '0.5px solid #6EE7B7' }}>
          Account created — please sign in.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '0.5px solid #FCA5A5' }}>
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="you@example.com" className="input" />
        </div>
        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          required
        />
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2" style={{ color: 'white' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Signing in…
            </span>
          ) : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium" style={{ color: 'var(--orange)' }}>Create one</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-80 flex-col justify-between p-10" style={{ background: 'var(--purple-dark)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Appti" style={{ height: 32, width: 'auto' }} />
          <span className="font-semibold text-white">{process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}</span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-white leading-snug mb-3">
            Smart booking for service businesses
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            SMS and email reminders, calendar sync, and pay-as-you-go pricing.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 {process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Suspense fallback={
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-dark)' }}>Welcome back</h1>
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

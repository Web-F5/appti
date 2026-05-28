'use client'
// src/app/(booking)/appointments/[id]/cancel/page.tsx
// Public page for clients to cancel their appointment via the token in their email.

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'

type AppointmentInfo = {
  serviceName:  string
  businessName: string
  startsAt:     string
  staffName:    string
  status:       string
}

function CancelPageContent() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const id    = params.id as string
  const token = searchParams.get('token') ?? ''

  const [appt,    setAppt]    = useState<AppointmentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [status,  setStatus]  = useState<'confirm' | 'cancelling' | 'cancelled' | 'error'>('confirm')

  useEffect(() => {
    if (!id || !token) { setError('Invalid cancellation link.'); setLoading(false); return }
    fetch(`/api/appointments/${id}/cancel?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setAppt(d.data)
        else setError(d.error ?? 'Appointment not found.')
      })
      .catch(() => setError('Could not load appointment details.'))
      .finally(() => setLoading(false))
  }, [id, token])

  async function handleCancel() {
    setStatus('cancelling')
    try {
      const res  = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (res.ok) setStatus('cancelled')
      else { setError(data.error ?? 'Cancellation failed.'); setStatus('error') }
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }

  const dateStr = appt ? new Date(appt.startsAt).toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : ''

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3FB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, background: '#2D1B69', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          <img src="/logo.png" alt="Appti" style={{ height: 32, width: 'auto' }} />
        </div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2D1B69' }}>{APP_NAME}</p>
      </div>

      <div style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 20, padding: 40, border: '0.5px solid #E2DCEF', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8B82B0' }}>
            <p style={{ fontSize: 14 }}>Loading appointment details…</p>
          </div>
        )}

        {error && status !== 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1035', marginBottom: 8 }}>Link not valid</h2>
            <p style={{ fontSize: 14, color: '#8B82B0', lineHeight: 1.6 }}>{error}</p>
            <p style={{ fontSize: 13, color: '#8B82B0', marginTop: 16 }}>
              If you need to cancel, please contact the business directly.
            </p>
          </div>
        )}

        {!loading && !error && appt && status === 'confirm' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1035', marginBottom: 4 }}>Cancel appointment</h2>
            <p style={{ fontSize: 14, color: '#8B82B0', marginBottom: 24 }}>Are you sure you want to cancel the following appointment?</p>

            <div style={{ background: '#F5F3FB', borderRadius: 14, padding: '18px 20px', marginBottom: 28, border: '0.5px solid #E2DCEF' }}>
              {[
                ['Service',  appt.serviceName],
                ['Business', appt.businessName],
                ['With',     appt.staffName],
                ['When',     dateStr],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: '#8B82B0', fontWeight: 500 }}>{label}</span>
                  <span style={{ color: '#1A1035', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleCancel}
                style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer' }}>
                Yes, cancel this appointment
              </button>
              <Link href="/" style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#8B82B0', textDecoration: 'none', border: '0.5px solid #E2DCEF' }}>
                Keep my appointment
              </Link>
            </div>
          </>
        )}

        {status === 'cancelling' && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8B82B0' }}>
            <p style={{ fontSize: 14 }}>Cancelling your appointment…</p>
          </div>
        )}

        {status === 'cancelled' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>✓</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1035', marginBottom: 8 }}>Appointment cancelled</h2>
            <p style={{ fontSize: 14, color: '#8B82B0', lineHeight: 1.6 }}>
              Your appointment has been cancelled. If this was a mistake, please contact {appt?.businessName ?? 'the business'} directly to rebook.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1035', marginBottom: 8 }}>Cancellation failed</h2>
            <p style={{ fontSize: 14, color: '#8B82B0', lineHeight: 1.6 }}>{error}</p>
            <p style={{ fontSize: 13, color: '#8B82B0', marginTop: 16 }}>
              Please contact the business directly to cancel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F5F3FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8B82B0', fontSize: 14 }}>Loading…</p>
      </div>
    }>
      <CancelPageContent/>
    </Suspense>
  )
}

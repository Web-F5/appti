// src/app/(marketing)/landing/page.tsx
// Public landing page for appti.net
// Palette: dark purple (#2D1B69), light blue (#60A5FA), orange (#E8845A)

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Appti — Online booking for trades and service businesses',
  description: 'SMS and email reminders, calendar sync, and pay-as-you-go pricing. Built for tradies, medical, and service businesses.',
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Online booking, 24/7',
    body: 'Clients book themselves from any device. You wake up to a full schedule without lifting a finger.',
  },
  {
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    title: 'SMS & email reminders',
    body: 'Automated reminders before every appointment cut no-shows dramatically. Pay only for messages sent.',
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Calendar sync',
    body: 'Every booking appears in your Google Calendar, Outlook, or Apple Calendar the moment it\'s made.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Multi-staff support',
    body: 'Run a team? Each staff member gets their own schedule and availability. Clients pick who they want.',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Business reports',
    body: 'See your busiest days, most popular services, and monthly trends at a glance.',
  },
  {
    icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    title: 'Embeddable widget',
    body: 'Drop a booking widget onto your existing website with a single line of code.',
  },
]

const PLANS = [
  {
    name: 'Pay as you go',
    price: '$0',
    period: '/ month',
    desc: 'No commitment. Top up credits and pay only for messages sent.',
    sms: '$0.12 per SMS',
    email: '$0.005 per email',
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/ month',
    desc: '150 SMS and 500 emails included. Cheaper rates on top-ups.',
    sms: '$0.08 per SMS over bundle',
    email: '$0.003 per email over bundle',
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/ month',
    desc: '500 SMS and 2,000 emails included. Lowest rates, white-label branding.',
    sms: '$0.06 per SMS over bundle',
    email: '$0.002 per email over bundle',
    cta: 'Start free trial',
    featured: false,
  },
]

const TESTIMONIALS = [
  { name: 'Dave R.', business: 'DR Electrical', quote: 'Cut my no-shows by more than half in the first month. Pays for itself.' },
  { name: 'Sarah M.', business: 'Bloom Beauty Studio', quote: 'My clients love being able to book at 10pm. I wake up with a full day.' },
  { name: 'Tom K.', business: 'Kowalski Plumbing', quote: 'Dead simple to set up. Had my first booking within an hour of signing up.' },
]

// ── Components ────────────────────────────────────────────────────────────────

function Icon({ path, size = 24 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F5F3FB', color: '#1A1035' }}>

      {/* ── Nav ── */}
      <nav style={{ background: '#2D1B69', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: '#E8845A', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'white', letterSpacing: '-0.01em' }}>{APP_NAME}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/login" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
              Sign in
            </Link>
            <Link href="/register" style={{ padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#E8845A', color: 'white', textDecoration: 'none' }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: '#2D1B69', paddingBottom: 80 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,0.15)', border: '0.5px solid rgba(96,165,250,0.3)', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60A5FA' }}/>
              <span style={{ fontSize: 13, color: '#60A5FA', fontWeight: 500 }}>Built for Australian trades and service businesses</span>
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Bookings that<br/>
              <span style={{ color: '#E8845A' }}>run themselves</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              Online booking, automated SMS and email reminders, and calendar sync — pay only for the messages you send.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="/register" style={{ padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 700, background: '#E8845A', color: 'white', textDecoration: 'none' }}>
                Start for free →
              </Link>
              <Link href="/book/demo-trades" target="_blank" style={{ padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.2)' }}>
                See demo
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Set up in under 5 minutes · Cancel anytime</p>
          </div>

          {/* Mock booking widget */}
          <div style={{ background: 'white', borderRadius: 20, padding: 0, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', border: '1.5px solid #EDE9FF' }}>
            <div style={{ background: '#2D1B69', padding: '20px 24px' }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>Demo Trades Co.</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '4px 0 0' }}>Online booking</p>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#4A3F7A', marginBottom: 12 }}>Select a service</p>
              {[
                { name: 'Standard Inspection', dur: '60 min', price: '$180', color: '#60A5FA' },
                { name: 'Quick Quote Visit',   dur: '30 min', price: 'Quote', color: '#E8845A' },
                { name: 'Emergency Call-Out',  dur: '90 min', price: '$320', color: '#EF4444' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: `0.5px solid ${i === 0 ? '#E8845A' : '#E2DCEF'}`, marginBottom: 8, background: i === 0 ? '#FEF0E8' : 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: i === 0 ? '#9A4520' : '#1A1035' }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#8B82B0' }}>{s.dur}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#9A4520' : '#2D1B69' }}>{s.price}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, background: '#F5F3FB', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="#8B82B0" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span style={{ fontSize: 12, color: '#8B82B0' }}>Next available: Today 2:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <div style={{ background: '#EDE9FF', borderTop: '0.5px solid #D4CCFF', borderBottom: '0.5px solid #D4CCFF', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[
            'No monthly lock-in',
            'Australian SMS routing',
            'Google & Outlook calendar sync',
            'ACMA compliant reminders',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="#4A2FA0" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#4A2FA0' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#1A1035', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Everything a service business needs
          </h2>
          <p style={{ fontSize: 18, color: '#8B82B0', maxWidth: 520, margin: '0 auto' }}>
            Built specifically for tradies, allied health, beauty, and any business that runs on appointments.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: 28, border: '0.5px solid #E2DCEF' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EDE9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="#4A2FA0" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon}/>
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1035', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#8B82B0', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ background: '#2D1B69', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Simple, honest pricing
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', maxWidth: 440, margin: '0 auto' }}>
              Start free, pay only for messages. Upgrade when you need more volume.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                background: plan.featured ? 'white' : 'rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: 32,
                border: plan.featured ? 'none' : '0.5px solid rgba(255,255,255,0.1)',
                position: 'relative',
              }}>
                {plan.featured && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#E8845A', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>
                    Most popular
                  </div>
                )}
                <p style={{ fontSize: 15, fontWeight: 700, color: plan.featured ? '#4A2FA0' : 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: plan.featured ? '#2D1B69' : 'white', letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span style={{ fontSize: 15, color: plan.featured ? '#8B82B0' : 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 14, color: plan.featured ? '#8B82B0' : 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24, minHeight: 48 }}>{plan.desc}</p>
                <div style={{ borderTop: `0.5px solid ${plan.featured ? '#E2DCEF' : 'rgba(255,255,255,0.1)'}`, paddingTop: 20, marginBottom: 24 }}>
                  {[plan.sms, plan.email, 'Unlimited appointments', 'Calendar sync free'].map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke={plan.featured ? '#4A2FA0' : '#60A5FA'} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span style={{ fontSize: 13, color: plan.featured ? '#4A3F7A' : 'rgba(255,255,255,0.7)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  background: plan.featured ? '#E8845A' : 'rgba(255,255,255,0.12)',
                  color: plan.featured ? 'white' : 'rgba(255,255,255,0.85)',
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, color: '#1A1035', letterSpacing: '-0.02em', marginBottom: 56 }}>
          What our customers say
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: 28, border: '0.5px solid #E2DCEF' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width={16} height={16} viewBox="0 0 24 24" fill="#E8845A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p style={{ fontSize: 15, color: '#4A3F7A', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.quote}"</p>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1035', margin: 0 }}>{t.name}</p>
                <p style={{ fontSize: 13, color: '#8B82B0', margin: '2px 0 0' }}>{t.business}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#E8845A', padding: '80px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Ready to fill your calendar?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 36 }}>
            Create your account in minutes. No credit card required.
          </p>
          <Link href="/register" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 14, fontSize: 17, fontWeight: 800, background: '#2D1B69', color: 'white', textDecoration: 'none' }}>
            Get started free →
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'white', fontWeight: 600, textDecoration: 'underline' }}>Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#1A1035', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#E8845A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>{APP_NAME}</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
              { label: 'Contact', href: '#' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© 2026 {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}

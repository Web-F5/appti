'use client'
// src/app/(marketing)/contact/page.tsx
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function patch(u: Partial<typeof form>) { setForm(p => ({ ...p, ...u })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        // Sign up at formspree.io with contact@appti.net to get your form ID
        // Replace YOUR_FORM_ID with the ID from your Formspree dashboard
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '0.5px solid #C8BFEA', background: 'white',
    fontSize: 14, color: '#1A1035', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#4A3F7A', marginBottom: 6,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>

        {/* Left */}
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1A1035', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Get in touch
          </h1>
          <p style={{ fontSize: 16, color: '#8B82B0', lineHeight: 1.7, marginBottom: 40 }}>
            Have a question, need help with setup, or want to give feedback?
            We'd love to hear from you.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              {
                icon: '✉️',
                label: 'Email support',
                value: 'contact@appti.net',
                href: 'mailto:contact@appti.net',
              },
              {
                icon: '📖',
                label: 'Help centre',
                value: 'Browse our FAQ',
                href: '/help',
              },
              {
                icon: '⏱',
                label: 'Response time',
                value: 'We aim to reply within 1 business day',
                href: null,
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 44, height: 44, background: '#EDE9FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#8B82B0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                    {item.label}
                  </p>
                  {item.href ? (
                    <a href={item.href} style={{ fontSize: 15, color: '#2D1B69', fontWeight: 600, textDecoration: 'none' }}>
                      {item.value}
                    </a>
                  ) : (
                    <p style={{ margin: 0, fontSize: 15, color: '#4A3F7A' }}>{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ background: 'white', borderRadius: 20, padding: 36, border: '0.5px solid #E2DCEF' }}>
          {status === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1035', marginBottom: 8 }}>Message sent!</h3>
              <p style={{ fontSize: 15, color: '#8B82B0' }}>We'll get back to you within one business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A1035', marginBottom: 4 }}>Send us a message</h2>

              {status === 'error' && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 13, border: '0.5px solid #FCA5A5' }}>
                  Something went wrong — please email us directly at contact@appti.net
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Your name</label>
                  <input type="text" value={form.name} onChange={e => patch({ name: e.target.value })} required style={inputStyle} placeholder="Jane Smith" />
                </div>
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" value={form.email} onChange={e => patch({ email: e.target.value })} required style={inputStyle} placeholder="jane@example.com" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                <select value={form.subject} onChange={e => patch({ subject: e.target.value })} required style={inputStyle}>
                  <option value="">Select a topic…</option>
                  <option value="Setup help">Setup help</option>
                  <option value="Billing question">Billing question</option>
                  <option value="Technical issue">Technical issue</option>
                  <option value="Feature request">Feature request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  value={form.message} onChange={e => patch({ message: e.target.value })}
                  required rows={5} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Tell us how we can help…"
                />
              </div>

              <button type="submit" disabled={status === 'sending'} style={{
                padding: '14px 0', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: '#E8845A', color: 'white', border: 'none', cursor: 'pointer',
                opacity: status === 'sending' ? 0.6 : 1,
              }}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

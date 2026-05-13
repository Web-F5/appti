'use client'
import { useState } from 'react'
import type { Service, TimeSlot } from './BookingWizard'

type Props = { service: Service; slot: TimeSlot; staffMemberName: string; businessName: string; onSubmit: (d: { name: string; email: string; phone: string; notes: string }) => void; onBack: () => void; submitting: boolean }

function formatSlotSummary(slot: TimeSlot): string {
  const start = new Date(slot.startsAt)
  return start.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) + ' at ' + start.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function ClientForm({ service, slot, staffMemberName, businessName, onSubmit, onBack, submitting }: Props) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim())  e.name  = 'Please enter your name'
    if (!email.trim()) e.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!validate()) return; onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim() }) }

  const inputBase = "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
  const inputStyle = { border: '0.5px solid var(--border-strong)', background: 'var(--white)', color: 'var(--text-dark)' }

  return (
    <div>
      <button onClick={onBack} disabled={submitting} className="flex items-center gap-1 text-sm mb-6 transition-colors" style={{ color: 'var(--text-muted)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back
      </button>

      <div className="rounded-xl p-4 mb-8" style={{ background: 'var(--purple-light)', border: '0.5px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--purple-dark)' }}>{service.name}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-mid)' }}>{formatSlotSummary(slot)}</p>
        {staffMemberName && <p className="text-sm" style={{ color: 'var(--text-mid)' }}>with {staffMemberName}</p>}
        {service.price != null && <p className="text-sm font-semibold mt-1" style={{ color: 'var(--purple-dark)' }}>${Number(service.price).toFixed(2)}</p>}
      </div>

      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>Your details</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>We'll send your confirmation to the email address below.</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {[
          { label: 'Full name', id: 'name', type: 'text', value: name, onChange: setName, placeholder: 'Jane Smith', required: true, error: errors.name },
          { label: 'Email address', id: 'email', type: 'email', value: email, onChange: setEmail, placeholder: 'jane@example.com', required: true, error: errors.email },
          { label: 'Phone number', id: 'phone', type: 'tel', value: phone, onChange: setPhone, placeholder: '0412 345 678', required: false, error: '' },
        ].map(f => (
          <div key={f.id}>
            <label htmlFor={f.id} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
              {f.label} {f.required && <span style={{ color: 'var(--orange)' }}>*</span>}
            </label>
            <input id={f.id} type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} required={f.required} className={inputBase} style={{ ...inputStyle, borderColor: f.error ? '#FCA5A5' : 'var(--border-strong)' }} />
            {f.error && <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{f.error}</p>}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
            Notes <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="Anything we should know…" className={inputBase} style={{ ...inputStyle, resize: 'none' }} />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{notes.length}/500</p>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full mt-2" style={{ color: 'white', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              Confirming…
            </span>
          ) : 'Confirm booking'}
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>By confirming you agree to receive email and SMS reminders about your appointment.</p>
      </form>
    </div>
  )
}

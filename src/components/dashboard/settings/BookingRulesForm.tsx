'use client'
// src/components/dashboard/settings/BookingRulesForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NumberField, Toggle, SaveButton, Section, Toast, useToast } from './FormPrimitives'

export default function BookingRulesForm({ business }: { business: any }) {
  const router = useRouter()
  const { toast, showToast } = useToast()

  const [form, setForm] = useState({
    bookingLeadHours:  business.bookingLeadHours  ?? 2,
    bookingMaxDays:    business.bookingMaxDays    ?? 60,
    requiresConfirm:   business.requiresConfirm   ?? false,
    allowClientCancel: business.allowClientCancel ?? true,
    cancelLeadHours:   business.cancelLeadHours   ?? 24,
  })
  const [loading, setLoading] = useState(false)

  function patch(updates: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/businesses/${business.slug}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Save failed', 'error'); return }

      showToast('Booking rules saved')
      router.refresh()
    } catch {
      showToast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <Section title="Availability">
          <div className="space-y-5">
            <NumberField
              label="Minimum lead time"
              id="bookingLeadHours"
              value={form.bookingLeadHours}
              onChange={v => patch({ bookingLeadHours: v })}
              min={0} max={72}
              suffix="hours before appointment"
              hint="Clients can't book within this window of the appointment time"
            />
            <NumberField
              label="How far ahead clients can book"
              id="bookingMaxDays"
              value={form.bookingMaxDays}
              onChange={v => patch({ bookingMaxDays: v })}
              min={1} max={365}
              suffix="days"
            />
          </div>
        </Section>

        <Section title="Confirmation & cancellation">
          <div className="divide-y divide-gray-100">
            <Toggle
              label="Require manual confirmation"
              description="New bookings stay as Pending until you confirm them"
              checked={form.requiresConfirm}
              onChange={v => patch({ requiresConfirm: v })}
            />
            <Toggle
              label="Allow clients to cancel"
              description="Clients can cancel via the link in their confirmation email"
              checked={form.allowClientCancel}
              onChange={v => patch({ allowClientCancel: v })}
            />
            {form.allowClientCancel && (
              <div className="pt-4">
                <NumberField
                  label="Cancellation deadline"
                  id="cancelLeadHours"
                  value={form.cancelLeadHours}
                  onChange={v => patch({ cancelLeadHours: v })}
                  min={0}
                  suffix="hours before appointment"
                  hint="Clients cannot cancel within this window"
                />
              </div>
            )}
          </div>
        </Section>

        <SaveButton loading={loading} />
      </form>
    </>
  )
}

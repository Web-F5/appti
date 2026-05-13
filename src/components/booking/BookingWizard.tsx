'use client'
// src/components/booking/BookingWizard.tsx
// Multi-step booking wizard orchestrator.
// Manages state across all steps and submits the final booking.

import { useState } from 'react'
import ServicePicker from './ServicePicker'
import StaffPicker from './StaffPicker'
import DateTimePicker from './DateTimePicker'
import ClientForm from './ClientForm'
import Confirmation from './Confirmation'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Service = {
  id: string
  name: string
  description: string | null
  durationMins: number
  price: number | null
  color: string | null
}

export type StaffMember = {
  id: string
  name: string
  avatarUrl: string | null
}

export type TimeSlot = {
  startsAt: string
  endsAt: string
  staffMemberId: string
  staffMemberName: string
}

export type BookingState = {
  service:      Service | null
  staffMember:  StaffMember | null
  slot:         TimeSlot | null
  clientName:   string
  clientEmail:  string
  clientPhone:  string
  clientNotes:  string
}

type Step = 'service' | 'staff' | 'datetime' | 'details' | 'confirmed'

type Props = {
  businessSlug: string
  businessName: string
  primaryColor: string
  services:     Service[]
  staffMembers: StaffMember[]
  singleStaff:  boolean   // true = skip staff step
}

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: 'service',  label: 'Service'  },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'details',  label: 'Your Details' },
  { key: 'confirmed', label: 'Confirmed' },
]

function StepBar({ current }: { current: Step }) {
  const visibleSteps = STEPS
  const currentIndex = visibleSteps.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-0 mb-10">
      {visibleSteps.map((step, i) => {
        const done    = i < currentIndex
        const active  = i === currentIndex
        const isLast  = i === visibleSteps.length - 1
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                style={{
                  background: done ? 'var(--purple-mid)' : active ? 'var(--orange)' : 'var(--border)',
                  color: done || active ? 'white' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 0 4px rgba(232,132,90,0.2)' : 'none',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 font-medium whitespace-nowrap" style={{
                color: active ? 'var(--orange)' : done ? 'var(--purple-mid)' : 'var(--text-muted)',
              }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mx-2 mb-4 transition-all duration-500" style={{
                background: done ? 'var(--purple-mid)' : 'var(--border)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function BookingWizard({
  businessSlug,
  businessName,
  primaryColor,
  services,
  staffMembers,
  singleStaff,
}: Props) {
  const [step, setStep] = useState<Step>('service')
  const [booking, setBooking] = useState<BookingState>({
    service:     null,
    staffMember: singleStaff ? staffMembers[0] ?? null : null,
    slot:        null,
    clientName:  '',
    clientEmail: '',
    clientPhone: '',
    clientNotes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [confirmedId, setConfirmedId] = useState<string | null>(null)

  function patch(updates: Partial<BookingState>) {
    setBooking((prev) => ({ ...prev, ...updates }))
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function onServiceSelected(service: Service) {
    patch({ service, slot: null })
    setStep(singleStaff ? 'datetime' : 'staff')
  }

  function onStaffSelected(staffMember: StaffMember) {
    // 'any' is a UI sentinel — don't store it, just clear selection and move on
    if (staffMember.id === 'any') {
      patch({ staffMember: null, slot: null })
    } else {
      patch({ staffMember, slot: null })
    }
    setStep('datetime')
  }

  function onSlotSelected(slot: TimeSlot) {
    // If staffMember came from slot (any-staff mode), update it
    patch({
      slot,
      staffMember: {
        id:       slot.staffMemberId,
        name:     slot.staffMemberName,
        avatarUrl: booking.staffMember?.avatarUrl ?? null,
      },
    })
    setStep('details')
  }

  function goBack() {
    if (step === 'staff')    setStep('service')
    if (step === 'datetime') setStep(singleStaff ? 'service' : 'staff')
    if (step === 'details')  setStep('datetime')
    setError(null)
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function onSubmit(details: { name: string; email: string; phone: string; notes: string }) {
    if (!booking.service || !booking.staffMember || !booking.slot) return
    setSubmitting(true)
    setError(null)
    patch({ clientName: details.name, clientEmail: details.email, clientPhone: details.phone, clientNotes: details.notes })

    try {
      const res = await fetch('/api/appointments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          serviceId:     booking.service.id,
          staffMemberId: booking.staffMember.id,
          startsAt:      booking.slot.startsAt,
          clientName:    details.name,
          clientEmail:   details.email,
          clientPhone:   details.phone   || undefined,
          clientNotes:   details.notes   || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        // If slot was taken, send back to date picker
        if (data.code === 'SLOT_UNAVAILABLE') {
          patch({ slot: null })
          setStep('datetime')
        }
        return
      }

      setConfirmedId(data.data.appointmentId)
      setStep('confirmed')
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {step !== 'confirmed' && <StepBar current={step} />}

      {error && step !== 'datetime' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 'service' && (
        <ServicePicker
          services={services}
          onSelect={onServiceSelected}
        />
      )}

      {step === 'staff' && booking.service && (
        <StaffPicker
          staffMembers={staffMembers}
          service={booking.service}
          onSelect={onStaffSelected}
          onBack={goBack}
        />
      )}

      {step === 'datetime' && booking.service && (
        <DateTimePicker
          businessSlug={businessSlug}
          service={booking.service}
          staffMember={booking.staffMember}
          onSelect={onSlotSelected}
          onBack={goBack}
          slotError={error}
        />
      )}

      {step === 'details' && booking.service && booking.slot && (
        <ClientForm
          service={booking.service}
          slot={booking.slot}
          staffMemberName={booking.staffMember?.name ?? ''}
          businessName={businessName}
          onSubmit={onSubmit}
          onBack={goBack}
          submitting={submitting}
        />
      )}

      {step === 'confirmed' && booking.service && booking.slot && (
        <Confirmation
          service={booking.service}
          slot={booking.slot}
          clientName={booking.clientName}
          staffMemberName={booking.staffMember?.name ?? ''}
          businessName={businessName}
          appointmentId={confirmedId ?? ''}
        />
      )}
    </div>
  )
}

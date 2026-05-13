'use client'
// src/components/booking/DateTimePicker.tsx
// Step 3 — client picks a date then selects a time slot.
// Fetches available slots from /api/availability on date change.

import { useState, useEffect, useCallback } from 'react'
import type { Service, StaffMember, TimeSlot } from './BookingWizard'

type Props = {
  businessSlug: string
  service:      Service
  staffMember:  StaffMember | null
  onSelect:     (slot: TimeSlot) => void
  onBack:       () => void
  slotError:    string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Generate a 6-week calendar grid starting from today
function buildCalendarDays(today: Date): Date[] {
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1) // Start on Monday
  const days: Date[] = []
  for (let i = 0; i < 42; i++) days.push(addDays(start, i))
  return days
}

// ── Mini calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({
  today,
  selected,
  maxDate,
  onSelect,
}: {
  today:    Date
  selected: Date | null
  maxDate:  Date
  onSelect: (d: Date) => void
}) {
  const [viewDate, setViewDate] = useState(() => new Date(today))
  const days = buildCalendarDays(viewDate)

  const monthLabel = viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const todayStr   = toLocalDateString(today)
  const selectedStr = selected ? toLocalDateString(selected) : null
  const maxStr     = toLocalDateString(maxDate)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span className="font-semibold text-gray-900 text-sm">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const ds         = toLocalDateString(day)
          const inMonth    = day.getMonth() === viewDate.getMonth()
          const isPast     = ds < todayStr
          const isFuture   = ds > maxStr
          const isSelected = ds === selectedStr
          const isToday    = ds === todayStr
          const disabled   = isPast || isFuture || !inMonth

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && onSelect(day)}
              className={[
                'w-full aspect-square rounded-lg text-sm flex items-center justify-center transition-all',
                disabled && 'opacity-25 cursor-not-allowed',
                !disabled && !isSelected && 'hover:bg-opacity-10',
                isSelected && 'text-white font-semibold shadow-sm',
                isToday && !isSelected && 'font-bold',
                !inMonth && 'opacity-0 pointer-events-none',
              ].filter(Boolean).join(' ')}
              style={{
                background: isSelected ? 'var(--purple-dark)' : undefined,
                color: isToday && !isSelected ? 'var(--orange)' : isSelected ? 'white' : undefined,
              }}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Time slots ────────────────────────────────────────────────────────────────

function TimeSlotGrid({
  slots,
  loading,
  error,
  onSelect,
}: {
  slots:    TimeSlot[]
  loading:  boolean
  error:    string | null
  onSelect: (slot: TimeSlot) => void
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg className="w-6 h-6 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="text-sm">Finding available times…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p className="font-medium">No times available</p>
        <p className="text-sm mt-1">Try a different date.</p>
      </div>
    )
  }

  // Group by AM/PM
  const am = slots.filter((s) => new Date(s.startsAt).getHours() < 12)
  const pm = slots.filter((s) => new Date(s.startsAt).getHours() >= 12)

  function SlotButton({ slot }: { slot: TimeSlot }) {
    return (
      <button
        onClick={() => onSelect(slot)}
        className="py-2.5 px-3 rounded-xl text-sm font-medium text-center transition-all duration-150"
        style={{ border: '0.5px solid var(--border-strong)', color: 'var(--text-dark)', background: 'var(--white)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = 'var(--orange-soft)'; e.currentTarget.style.color = 'var(--orange-dark)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--text-dark)' }}
      >
        {formatTime(slot.startsAt)}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {am.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Morning</p>
          <div className="grid grid-cols-3 gap-2">
            {am.map((slot, i) => <SlotButton key={i} slot={slot} />)}
          </div>
        </div>
      )}
      {pm.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Afternoon</p>
          <div className="grid grid-cols-3 gap-2">
            {pm.map((slot, i) => <SlotButton key={i} slot={slot} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DateTimePicker({
  businessSlug, service, staffMember, onSelect, onBack, slotError,
}: Props) {
  const today   = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = addDays(today, 60)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots,   setSlots]   = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchSlots = useCallback(async (date: Date) => {
    setLoading(true)
    setFetchError(null)
    setSlots([])

    const ds = toLocalDateString(date)
    const staffId = (staffMember && staffMember.id !== 'any' && staffMember.id !== '') ? staffMember.id : undefined

    const params = new URLSearchParams({
      businessSlug,
      serviceId: service.id,
      date: ds,
      ...(staffId ? { staffMemberId: staffId } : {}),
    })

    try {
      const res  = await fetch(`/api/availability?${params}`)
      const data = await res.json()

      if (!res.ok) {
        setFetchError(data.error ?? 'Failed to load available times.')
        return
      }

      setSlots(data.data.slots ?? [])
    } catch {
      setFetchError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }, [businessSlug, service.id, staffMember])

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate)
  }, [selectedDate, fetchSlots])

  function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSlots([])
    setFetchError(null)
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <h2 className="text-xl font-semibold text-gray-900 mb-1">Pick a date & time</h2>
      <p className="text-sm text-gray-500 mb-6">
        <span className="font-medium text-gray-700">{service.name}</span>
        {staffMember && staffMember.id !== 'any' && ` with ${staffMember.name}`}
        {' · '}{service.durationMins} min
      </p>

      {slotError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          That slot was just taken — please choose another time.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MiniCalendar
          today={today}
          selected={selectedDate}
          maxDate={maxDate}
          onSelect={handleDateSelect}
        />

        <div>
          {selectedDate ? (
            <>
              <p className="text-sm font-medium text-gray-700 mb-3">
                {formatDateDisplay(selectedDate)}
              </p>
              <TimeSlotGrid
                slots={slots}
                loading={loading}
                error={fetchError}
                onSelect={onSelect}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-gray-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p className="text-sm">Select a date to see times</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

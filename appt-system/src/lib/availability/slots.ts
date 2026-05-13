// src/lib/availability/slots.ts
//
// Pure slot calculation engine — no HTTP, no side effects.
// Given a staff member, service, and date, returns available TimeSlot objects.
//
// Called by:
//   src/app/api/availability/route.ts  (booking widget)
//   src/app/api/appointments/route.ts  (race-condition check at booking time)

import {
  parseISO,
  addMinutes,
  isWithinInterval,
  areIntervalsOverlapping,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isBefore,
  addHours,
  getDay,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { prisma } from '@/lib/prisma/client'
import type { TimeSlot } from '@/types'

// ── Day of week mapping ───────────────────────────────────────────────────────
// date-fns getDay() returns 0=Sunday, 1=Monday ... 6=Saturday
// Our DayOfWeek enum uses MONDAY, TUESDAY, etc.

const DAY_INDEX_MAP: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Interval = { start: Date; end: Date }

type GetSlotsParams = {
  businessSlug: string
  serviceId: string
  date: string         // YYYY-MM-DD in the business's timezone
  staffMemberId?: string  // if omitted, check all eligible staff and merge slots
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Returns available booking slots for a given service and date.
 * All times in the returned slots are UTC Date objects.
 */
export async function getAvailableSlots(params: GetSlotsParams): Promise<TimeSlot[]> {
  const { businessSlug, serviceId, date, staffMemberId } = params

  // ── 1. Load business, service, and eligible staff ─────────────────────────
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: {
      id: true,
      timezone: true,
      bookingLeadHours: true,
      bookingMaxDays: true,
    },
  })

  if (!business) return []

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, isActive: true },
    select: { id: true, durationMins: true },
  })

  if (!service) return []

  // Validate date is not beyond bookingMaxDays
  const targetDate = parseISO(date) // treated as a local date string
  const maxDate = addDays(new Date(), business.bookingMaxDays)
  if (isBefore(maxDate, targetDate)) return []

  // Determine which staff to check
  const staffQuery = {
    where: {
      businessId: business.id,
      isActive: true,
      ...(staffMemberId ? { id: staffMemberId } : {}),
      staffServices: { some: { serviceId } },
    },
    select: { id: true, name: true },
  }

  const eligibleStaff = await prisma.staffMember.findMany(staffQuery)
  if (eligibleStaff.length === 0) return []

  // ── 2. Calculate slots per staff member, then merge ───────────────────────
  const allSlots: TimeSlot[] = []

  for (const staff of eligibleStaff) {
    const slots = await getSlotsForStaffMember({
      staffMemberId: staff.id,
      staffName: staff.name,
      serviceId,
      durationMins: service.durationMins,
      date,
      timezone: business.timezone,
      bookingLeadHours: business.bookingLeadHours,
    })
    allSlots.push(...slots)
  }

  // Sort chronologically
  return allSlots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

// ── Per-staff slot calculation ────────────────────────────────────────────────

async function getSlotsForStaffMember(params: {
  staffMemberId: string
  staffName: string
  serviceId: string
  durationMins: number
  date: string
  timezone: string
  bookingLeadHours: number
}): Promise<TimeSlot[]> {
  const { staffMemberId, staffName, durationMins, date, timezone, bookingLeadHours } = params

  // Parse the requested date in the business timezone
  const [year, month, day] = date.split('-').map(Number)
  const dayOfWeek = getDayOfWeekForDate(year, month, day, timezone)

  // ── Step 1: Find working hours for this day of week ───────────────────────
  const rules = await prisma.availabilityRule.findMany({
    where: { staffMemberId, dayOfWeek: dayOfWeek as any },
  })

  if (rules.length === 0) return [] // staff not working this day

  // Build UTC intervals from the HH:MM strings + business timezone
  const workIntervals: Interval[] = rules.map((rule) => ({
    start: parseTimeInTz(date, rule.startTime, timezone),
    end:   parseTimeInTz(date, rule.endTime,   timezone),
  }))

  // ── Step 2: Load busy times ───────────────────────────────────────────────
  // Build day boundaries in UTC for DB query
  const dayStartUtc = fromZonedTime(
    new Date(year, month - 1, day, 0, 0, 0),
    timezone
  )
  const dayEndUtc = fromZonedTime(
    new Date(year, month - 1, day, 23, 59, 59),
    timezone
  )

  const [existingAppointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        staffMemberId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        startsAt: { lt: dayEndUtc },
        endsAt:   { gt: dayStartUtc },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.blockedTime.findMany({
      where: {
        staffMemberId,
        startsAt: { lt: dayEndUtc },
        endsAt:   { gt: dayStartUtc },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ])

  const busyIntervals: Interval[] = [
    ...existingAppointments.map((a) => ({ start: a.startsAt, end: a.endsAt })),
    ...blockedTimes.map((b) => ({ start: b.startsAt, end: b.endsAt })),
  ]

  // ── Step 3: Subtract busy intervals from work intervals ───────────────────
  let freeIntervals: Interval[] = workIntervals

  for (const busy of busyIntervals) {
    freeIntervals = freeIntervals.flatMap((free) =>
      subtractInterval(free, busy)
    )
  }

  // ── Step 4: Generate candidate slots from free time ───────────────────────
  const slots: TimeSlot[] = []
  const leadTimeCutoff = addHours(new Date(), bookingLeadHours)

  for (const free of freeIntervals) {
    let slotStart = free.start

    while (true) {
      const slotEnd = addMinutes(slotStart, durationMins)

      // Slot must fit entirely within the free interval
      if (isBefore(free.end, slotEnd)) break

      // ── Step 5: Apply lead time filter ─────────────────────────────────
      if (!isBefore(slotStart, leadTimeCutoff)) {
        slots.push({
          startsAt: slotStart,
          endsAt: slotEnd,
          staffMemberId: params.staffMemberId,
          staffMemberName: staffName,
        })
      }

      slotStart = slotEnd // slots are back-to-back with no gap
    }
  }

  return slots
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse "HH:MM" time string on a given YYYY-MM-DD date in the given timezone,
 * returning a UTC Date.
 */
function parseTimeInTz(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)

  // Build a date in the local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)

  // Convert to UTC
  return fromZonedTime(localDate, timezone)
}

/**
 * Get the Prisma DayOfWeek enum value for a given calendar date in a timezone.
 */
function getDayOfWeekForDate(
  year: number,
  month: number,
  day: number,
  timezone: string
): string {
  const localDate = new Date(year, month - 1, day, 12, 0, 0) // noon to avoid DST edge
  const zonedDate = toZonedTime(localDate, timezone)
  const dayIndex = getDay(zonedDate) // 0=Sunday
  return DAY_INDEX_MAP[dayIndex]
}

/**
 * Subtract a busy interval from a free interval.
 * Returns 0, 1, or 2 remaining free intervals.
 */
function subtractInterval(free: Interval, busy: Interval): Interval[] {
  // No overlap — free interval unchanged
  if (!areIntervalsOverlapping(free, busy, { inclusive: false })) {
    return [free]
  }

  const result: Interval[] = []

  // Free time before the busy block
  if (isBefore(free.start, busy.start)) {
    result.push({ start: free.start, end: busy.start })
  }

  // Free time after the busy block
  if (isBefore(busy.end, free.end)) {
    result.push({ start: busy.end, end: free.end })
  }

  return result
}

/** Add days to a date (simple helper) */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

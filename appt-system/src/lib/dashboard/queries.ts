// src/lib/dashboard/queries.ts
// Server-side data queries for the dashboard pages.
// All functions take a businessSlug and return typed data.
// Once auth is added, businessSlug comes from the session.

import { prisma } from '@/lib/prisma/client'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  appointmentsToday:    number
  appointmentsThisWeek: number
  appointmentsTotal:    number
  newClientsThisMonth:  number
  totalClients:         number
  smsThisMonth:         number
  emailThisMonth:       number
  creditBalance:        number
  plan:                 string
}

export type UpcomingAppointment = {
  id:             string
  startsAt:       Date
  endsAt:         Date
  status:         string
  serviceName:    string
  serviceColor:   string | null
  clientName:     string
  clientEmail:    string
  clientPhone:    string | null
  staffName:      string
  durationMins:   number
}

export type RecentClient = {
  id:          string
  name:        string
  email:       string
  phone:       string | null
  createdAt:   Date
  totalBookings: number
}

export type UsageByDay = {
  date:       string
  sms:        number
  email:      number
  cost:       number
}

// ── Business lookup helper ────────────────────────────────────────────────────

export async function getBusinessBySlug(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    select: {
      id:            true,
      name:          true,
      slug:          true,
      timezone:      true,
      plan:          true,
      creditBalance: true,
      planRenewsAt:  true,
    },
  })
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(
  businessId: string,
  timezone: string
): Promise<DashboardStats> {
  const now       = new Date()
  const todayStart = fromZonedStartOfDay(now, timezone)
  const todayEnd   = fromZonedEndOfDay(now, timezone)
  const weekStart  = getStartOfWeek(now, timezone)
  const monthStart = fromZonedTime(startOfMonth(toZonedTime(now, timezone)), timezone)
  const monthEnd   = fromZonedTime(endOfMonth(toZonedTime(now, timezone)), timezone)

  const [
    appointmentsToday,
    appointmentsThisWeek,
    appointmentsTotal,
    newClientsThisMonth,
    totalClients,
    usageThisMonth,
    business,
  ] = await Promise.all([
    // Appointments today
    prisma.appointment.count({
      where: {
        service: { businessId },
        status: { in: ['CONFIRMED', 'PENDING'] },
        startsAt: { gte: todayStart, lte: todayEnd },
      },
    }),

    // Appointments this week
    prisma.appointment.count({
      where: {
        service: { businessId },
        status: { in: ['CONFIRMED', 'PENDING'] },
        startsAt: { gte: weekStart },
      },
    }),

    // All time appointments
    prisma.appointment.count({
      where: { service: { businessId } },
    }),

    // New clients this month
    prisma.client.count({
      where: {
        businessId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // Total clients
    prisma.client.count({
      where: { businessId },
    }),

    // Usage events this month
    prisma.usageEvent.groupBy({
      by: ['eventType'],
      where: {
        businessId,
        createdAt: { gte: monthStart, lte: monthEnd },
        eventType: { in: ['SMS_SENT', 'EMAIL_SENT'] },
      },
      _count: { eventType: true },
    }),

    // Business for credit balance
    prisma.business.findUnique({
      where: { id: businessId },
      select: { creditBalance: true, plan: true },
    }),
  ])

  const smsThisMonth   = usageThisMonth.find(u => u.eventType === 'SMS_SENT')?._count.eventType ?? 0
  const emailThisMonth = usageThisMonth.find(u => u.eventType === 'EMAIL_SENT')?._count.eventType ?? 0

  return {
    appointmentsToday,
    appointmentsThisWeek,
    appointmentsTotal,
    newClientsThisMonth,
    totalClients,
    smsThisMonth,
    emailThisMonth,
    creditBalance: Number(business?.creditBalance ?? 0),
    plan: business?.plan ?? 'PAYG',
  }
}

// ── Upcoming appointments ─────────────────────────────────────────────────────

export async function getUpcomingAppointments(
  businessId: string,
  limit = 10
): Promise<UpcomingAppointment[]> {
  const now = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      service: { businessId },
      status: { in: ['CONFIRMED', 'PENDING'] },
      startsAt: { gte: now },
    },
    include: {
      service:     { select: { name: true, color: true, durationMins: true } },
      staffMember: { select: { name: true } },
      client:      { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startsAt: 'asc' },
    take: limit,
  })

  return appointments.map(a => ({
    id:           a.id,
    startsAt:     a.startsAt,
    endsAt:       a.endsAt,
    status:       a.status,
    serviceName:  a.service.name,
    serviceColor: a.service.color,
    durationMins: a.service.durationMins,
    clientName:   a.client.name,
    clientEmail:  a.client.email,
    clientPhone:  a.client.phone,
    staffName:    a.staffMember.name,
  }))
}

// ── Today's appointments ──────────────────────────────────────────────────────

export async function getTodaysAppointments(
  businessId: string,
  timezone: string
): Promise<UpcomingAppointment[]> {
  const now      = new Date()
  const dayStart = fromZonedStartOfDay(now, timezone)
  const dayEnd   = fromZonedEndOfDay(now, timezone)

  const appointments = await prisma.appointment.findMany({
    where: {
      service: { businessId },
      status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      service:     { select: { name: true, color: true, durationMins: true } },
      staffMember: { select: { name: true } },
      client:      { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startsAt: 'asc' },
  })

  return appointments.map(a => ({
    id:           a.id,
    startsAt:     a.startsAt,
    endsAt:       a.endsAt,
    status:       a.status,
    serviceName:  a.service.name,
    serviceColor: a.service.color,
    durationMins: a.service.durationMins,
    clientName:   a.client.name,
    clientEmail:  a.client.email,
    clientPhone:  a.client.phone,
    staffName:    a.staffMember.name,
  }))
}

// ── Recent clients ────────────────────────────────────────────────────────────

export async function getRecentClients(
  businessId: string,
  limit = 10
): Promise<RecentClient[]> {
  const clients = await prisma.client.findMany({
    where: { businessId },
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return clients.map(c => ({
    id:            c.id,
    name:          c.name,
    email:         c.email,
    phone:         c.phone,
    createdAt:     c.createdAt,
    totalBookings: c._count.appointments,
  }))
}

// ── Usage over last 30 days ───────────────────────────────────────────────────

export async function getUsageLast30Days(
  businessId: string
): Promise<UsageByDay[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const events = await prisma.usageEvent.findMany({
    where: {
      businessId,
      createdAt: { gte: since },
      eventType: { in: ['SMS_SENT', 'EMAIL_SENT'] },
    },
    select: {
      eventType: true,
      cost:      true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const byDate: Record<string, UsageByDay> = {}

  for (const event of events) {
    const date = format(event.createdAt, 'yyyy-MM-dd')
    if (!byDate[date]) {
      byDate[date] = { date, sms: 0, email: 0, cost: 0 }
    }
    if (event.eventType === 'SMS_SENT')   byDate[date].sms++
    if (event.eventType === 'EMAIL_SENT') byDate[date].email++
    byDate[date].cost += Number(event.cost)
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fromZonedStartOfDay(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone)
  const start = startOfDay(zoned)
  return fromZonedTime(start, timezone)
}

function fromZonedEndOfDay(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone)
  const end   = endOfDay(zoned)
  return fromZonedTime(end, timezone)
}

function getStartOfWeek(date: Date, timezone: string): Date {
  const zoned  = toZonedTime(date, timezone)
  const day    = zoned.getDay()
  const diff   = day === 0 ? -6 : 1 - day // Monday start
  const monday = new Date(zoned)
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return fromZonedTime(monday, timezone)
}

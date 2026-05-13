// src/app/api/calendar/[businessSlug]/feed.ics/route.ts
// Serves a read-only iCal feed for a business.
// Any calendar app (Apple Calendar, Thunderbird, Google) can subscribe to this URL.
// URL: /api/calendar/demo-trades/feed.ics

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { generateIcs } from '@/lib/caldav/ical'
import ical from 'ical-generator'

type Params = { params: Promise<{ businessSlug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { businessSlug } = await params

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
  })

  if (!business) {
    return new Response('Business not found', { status: 404 })
  }

  // Fetch upcoming confirmed appointments (30 days back, 90 days forward)
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const to = new Date()
  to.setDate(to.getDate() + 90)

  const appointments = await prisma.appointment.findMany({
    where: {
      service: { businessId: business.id },
      status: { in: ['CONFIRMED', 'PENDING'] },
      startsAt: { gte: from, lte: to },
    },
    include: {
      service: true,
      staffMember: true,
      client: true,
    },
    orderBy: { startsAt: 'asc' },
  })

  // Build combined iCal feed
  const calendar = ical({ name: `${business.name} — Appointments` })

  for (const appt of appointments) {
    calendar.createEvent({
      uid: appt.icalUid,
      start: appt.startsAt,
      end: appt.endsAt,
      summary: `${appt.service.name} — ${appt.client.name}`,
      description: [
        `Client: ${appt.client.name}`,
        appt.client.phone ? `Phone: ${appt.client.phone}` : '',
        appt.clientNotes ? `Notes: ${appt.clientNotes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  }

  return new Response(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${businessSlug}.ics"`,
      'Cache-Control': 'no-cache, no-store',
    },
  })
}

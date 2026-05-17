// src/app/api/calendar/[businessSlug]/feed.ics/route.ts
// Serves a read-only iCal feed for a business — for the business owner only.
// Requires a token query param: /api/calendar/demo-trades/feed.ics?token=xxx
// The token is the business ID (set in dashboard settings for calendar subscription).

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { generateIcs } from '@/lib/caldav/ical'
import ical from 'ical-generator'

type Params = { params: Promise<{ businessSlug: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { businessSlug } = await params

  // Allow access via session (dashboard) or token (calendar app subscription)
  const session  = await getServerSession(authOptions)
  const token    = req.nextUrl.searchParams.get('token')

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
  })

  if (!business) {
    return new Response('Business not found', { status: 404 })
  }

  // Auth check: must be logged in as this business, or provide business ID as token
  const isOwner      = session?.user?.businessSlug === businessSlug
  const hasValidToken = token === business.id

  if (!isOwner && !hasValidToken) {
    return new Response('Unauthorised', { status: 401 })
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
    const event = calendar.createEvent({
      start:   appt.startsAt,
      end:     appt.endsAt,
      summary: `${appt.service.name} — ${appt.client.name}`,
      description: [
        `Client: ${appt.client.name}`,
        appt.client.phone   ? `Phone: ${appt.client.phone}`   : '',
        appt.clientNotes    ? `Notes: ${appt.clientNotes}`    : '',
      ].filter(Boolean).join('\n'),
    })
    if (appt.icalUid) event.uid(appt.icalUid)
  }

  return new Response(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${businessSlug}.ics"`,
      'Cache-Control': 'no-cache, no-store',
    },
  })
}

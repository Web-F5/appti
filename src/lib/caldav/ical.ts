// src/lib/caldav/ical.ts
// iCal generation and CalDAV helpers.
// ical-generator builds RFC 5545 compliant .ics files.

import ical, { ICalCalendarMethod, ICalEventStatus } from 'ical-generator'
import type { Appointment, Service, StaffMember, Client, Business } from '@prisma/client'

export type AppointmentForIcal = Appointment & {
  service: Service
  staffMember: StaffMember
  client: Client
}

/**
 * Generate an iCal string for an appointment.
 * The same icalUid is used for CREATE, UPDATE, and CANCEL —
 * calendar clients use it to match and update existing events.
 */
export function generateIcs(
  appointment: AppointmentForIcal,
  business: Business,
  method: 'REQUEST' | 'CANCEL' = 'REQUEST'
): string {
  const calendar = ical({
    name: business.name,
    method: method === 'CANCEL' ? ICalCalendarMethod.CANCEL : ICalCalendarMethod.REQUEST,
  })

  const event = calendar.createEvent({
    start: appointment.startsAt,
    end:   appointment.endsAt,
    summary: `${appointment.service.name} — ${business.name}`,
    description: [
      `Service: ${appointment.service.name}`,
      `With: ${appointment.staffMember.name}`,
      appointment.clientNotes ? `Notes: ${appointment.clientNotes}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    organizer: {
      name:  business.name,
      email: process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com',
    },
    attendees: [
      {
        name:  appointment.client.name,
        email: appointment.client.email,
        rsvp:  false,
      },
    ],
  })
  if (appointment.icalUid) event.uid(appointment.icalUid)
  event.status(method === 'CANCEL' ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED)

  return calendar.toString()
}

/**
 * Generate a plain iCal feed URL for a business.
 * Any calendar app can subscribe to this read-only URL.
 */
export function getIcalFeedUrl(businessSlug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/api/calendar/${businessSlug}/feed.ics`
}
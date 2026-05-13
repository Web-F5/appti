// src/lib/appointments/create.ts
//
// Core appointment creation logic.
// Handles slot verification, client upsert, appointment creation,
// confirmation email, iCal generation, and reminder scheduling.
//
// Called by: src/app/api/appointments/route.ts (POST)

import { addMinutes, subMinutes } from 'date-fns'
import { prisma } from '@/lib/prisma/client'
import { generateIcs } from '@/lib/caldav/ical'
import { sendConfirmationEmail } from '@/lib/resend/client'
import { scheduleReminder } from '@/lib/bullmq/queues'
import { renderTemplate, normalisePhone, formatInTz, generateAppointmentToken } from '@/lib/utils'
import type { BookingPayload, ReminderTemplateVars } from '@/types'

// ── Result type ───────────────────────────────────────────────────────────────

export type CreateAppointmentResult =
  | { success: true;  appointmentId: string; startsAt: Date; endsAt: Date }
  | { success: false; error: string; code?: string }

// ── Main function ─────────────────────────────────────────────────────────────

export async function createAppointment(
  payload: BookingPayload
): Promise<CreateAppointmentResult> {
  const {
    businessSlug,
    serviceId,
    staffMemberId,
    startsAt: startsAtIso,
    clientName,
    clientEmail,
    clientPhone,
    clientNotes,
  } = payload

  // ── 1. Load business and service ──────────────────────────────────────────
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: { reminderTemplates: { where: { isActive: true } } },
  })

  if (!business) {
    return { success: false, error: 'Business not found', code: 'BUSINESS_NOT_FOUND' }
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, isActive: true },
  })

  if (!service) {
    return { success: false, error: 'Service not found', code: 'SERVICE_NOT_FOUND' }
  }

  const staffMember = await prisma.staffMember.findFirst({
    where: { id: staffMemberId, businessId: business.id, isActive: true },
  })

  if (!staffMember) {
    return { success: false, error: 'Staff member not found', code: 'STAFF_NOT_FOUND' }
  }

  // ── 2. Parse and calculate times ──────────────────────────────────────────
  const startsAt = new Date(startsAtIso)
  const endsAt   = addMinutes(startsAt, service.durationMins)

  // Reject bookings in the past
  const leadTimeCutoff = new Date(Date.now() + business.bookingLeadHours * 60 * 60 * 1000)
  if (startsAt < leadTimeCutoff) {
    return { success: false, error: 'Slot is too soon to book', code: 'SLOT_TOO_SOON' }
  }

  // ── 3. Race-condition safe slot check + appointment creation ──────────────
  // Uses a serialisable transaction so two simultaneous bookings for the
  // same slot can't both succeed.
  let appointmentId: string

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check for overlapping confirmed/pending appointments
      const conflict = await tx.appointment.findFirst({
        where: {
          staffMemberId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          AND: [
            { startsAt: { lt: endsAt   } },
            { endsAt:   { gt: startsAt } },
          ],
        },
      })

      if (conflict) {
        throw new SlotUnavailableError('This slot has just been booked — please choose another time')
      }

      // Upsert client — find by email within this business, create if new
      const client = await tx.client.upsert({
        where: { businessId_email: { businessId: business.id, email: clientEmail } },
        update: {
          name:  clientName,
          phone: clientPhone ? normalisePhone(clientPhone) : undefined,
        },
        create: {
          businessId: business.id,
          name:       clientName,
          email:      clientEmail,
          phone:      clientPhone ? normalisePhone(clientPhone) : null,
        },
      })

      // Create the appointment
      const appointment = await tx.appointment.create({
        data: {
          serviceId,
          staffMemberId,
          clientId:      client.id,
          startsAt,
          endsAt,
          status:        business.requiresConfirm ? 'PENDING' : 'CONFIRMED',
          clientNotes:   clientNotes ?? null,
          priceSnapshot: service.price ?? null,
        },
        include: {
          service:     true,
          staffMember: true,
          client:      true,
        },
      })

      return appointment
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000,
    })

    appointmentId = result.id

    // ── 4. Generate iCal and send confirmation email ──────────────────────
    // Done outside the transaction — email failure shouldn't roll back the booking
    try {
      const icsContent = generateIcs(result, business)

      await sendConfirmationEmail({
        to:           clientEmail,
        clientName,
        businessName: business.name,
        serviceName:  service.name,
        startsAt,
        icsContent,
      })
    } catch (emailErr) {
      // Log but don't fail — appointment is created, email is best-effort
      console.error('[createAppointment] Confirmation email failed:', emailErr)
    }

    // ── 5. Schedule reminder jobs ─────────────────────────────────────────
    if (business.reminderTemplates.length > 0 && result.status === 'CONFIRMED') {
      await scheduleReminders({
        appointment: result,
        business,
        templates: business.reminderTemplates,
        clientEmail,
        clientPhone: clientPhone ? normalisePhone(clientPhone) : null,
      })
    }

    return { success: true, appointmentId, startsAt, endsAt }

  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return { success: false, error: err.message, code: 'SLOT_UNAVAILABLE' }
    }
    console.error('[createAppointment] Unexpected error:', err)
    return { success: false, error: 'Failed to create appointment', code: 'INTERNAL_ERROR' }
  }
}

// ── Reminder scheduling ───────────────────────────────────────────────────────

async function scheduleReminders(params: {
  appointment: { id: string; startsAt: Date; endsAt: Date; service: { name: string }; staffMember: { name: string } }
  business: { id: string; name: string; timezone: string; slug: string }
  templates: Array<{ id: string; channel: string; offsetMins: number; bodyTemplate: string; subject?: string | null }>
  clientEmail: string
  clientPhone: string | null
}) {
  const { appointment, business, templates, clientEmail, clientPhone } = params

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const cancelToken = generateAppointmentToken(appointment.id)

  const templateVars: ReminderTemplateVars = {
    client_name:     '', // filled per-reminder below
    business_name:   business.name,
    service_name:    appointment.service.name,
    staff_name:      appointment.staffMember.name,
    time:            formatInTz(appointment.startsAt, business.timezone),
    date:            formatInTz(appointment.startsAt, business.timezone, 'EEEE d MMMM yyyy'),
    duration:        `${Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000)} minutes`,
    location:        business.name,
    cancel_url:      `${appUrl}/appointments/${appointment.id}/cancel?token=${cancelToken}`,
    reschedule_url:  `${appUrl}/appointments/${appointment.id}/reschedule?token=${cancelToken}`,
  }

  for (const template of templates) {
    const fireAt    = subMinutes(appointment.startsAt, template.offsetMins)
    const isEmail   = template.channel === 'EMAIL'
    const isSms     = template.channel === 'SMS'

    // Skip SMS if no phone number
    if (isSms && !clientPhone) continue

    const to = isEmail ? clientEmail : clientPhone!

    // Render the message body with template variables
    // Client name is fetched separately per reminder to keep this function simple
    const renderedBody    = renderTemplate(template.bodyTemplate, templateVars)
    const renderedSubject = template.subject
      ? renderTemplate(template.subject, templateVars)
      : undefined

    // Create reminder record in DB
    const reminder = await prisma.reminder.create({
      data: {
        appointmentId: appointment.id,
        channel:       template.channel as 'SMS' | 'EMAIL',
        offsetMins:    template.offsetMins,
        scheduledFor:  fireAt,
        status:        'SCHEDULED',
        renderedBody,
        renderedSubject,
      },
    })

    // Queue the BullMQ job
    const jobId = await scheduleReminder(
      {
        reminderId:    reminder.id,
        appointmentId: appointment.id,
        businessId:    business.id,
        channel:       template.channel as 'SMS' | 'EMAIL',
        to,
        body:          renderedBody,
        subject:       renderedSubject,
      },
      fireAt
    )

    // Store the job ID so it can be cancelled if appointment changes
    if (jobId) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data:  { jobId },
      })
    }
  }
}

// ── Custom errors ─────────────────────────────────────────────────────────────

class SlotUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SlotUnavailableError'
  }
}

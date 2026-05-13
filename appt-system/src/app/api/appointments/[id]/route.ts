// src/app/api/appointments/[id]/route.ts
// GET    /api/appointments/:id  — get a single appointment
// PATCH  /api/appointments/:id  — update status (confirm, cancel, no-show)
// DELETE /api/appointments/:id  — hard delete (admin only)

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { cancelReminder } from '@/lib/bullmq/queues'
import { generateIcs } from '@/lib/caldav/ical'
import { sendEmail } from '@/lib/resend/client'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  status:      z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  cancelledBy: z.enum(['client', 'business']).optional(),
})

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service:     true,
      staffMember: { select: { name: true, email: true } },
      client:      true,
      reminders:   true,
    },
  })

  if (!appointment) return apiError('Appointment not found', 404)

  return apiSuccess({ appointment })
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const { status, cancelledBy } = parsed.data

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service:     true,
      staffMember: true,
      client:      true,
      reminders:   { where: { status: 'SCHEDULED' } },
    },
  })

  if (!appointment) return apiError('Appointment not found', 404)

  // ── Handle cancellation ───────────────────────────────────────────────────
  if (status === 'CANCELLED') {
    const now = new Date()

    // Cancel all queued reminder jobs
    await Promise.all(
      appointment.reminders
        .filter((r) => r.jobId)
        .map((r) => cancelReminder(r.jobId!))
    )

    // Update reminder statuses and appointment in one transaction
    await prisma.$transaction([
      prisma.reminder.updateMany({
        where: { appointmentId: id, status: 'SCHEDULED' },
        data:  { status: 'CANCELLED' },
      }),
      prisma.appointment.update({
        where: { id },
        data:  {
          status:      'CANCELLED',
          cancelledAt: now,
          cancelledBy: cancelledBy ?? 'business',
        },
      }),
    ])

    // Send cancellation email with updated .ics
    try {
      const business = await prisma.business.findUnique({
        where: { id: appointment.service.businessId },
      })

      if (business) {
        const icsContent = generateIcs(appointment, business, 'CANCEL')
        await sendEmail(
          appointment.client.email,
          `Appointment cancelled — ${appointment.service.name} with ${business.name}`,
          `Hi ${appointment.client.name},\n\nYour appointment for ${appointment.service.name} on ${appointment.startsAt.toLocaleDateString('en-AU')} has been cancelled.\n\nIf you have any questions please contact us.\n\n${business.name}`
        )
      }
    } catch (err) {
      console.error('[appointments/cancel] Cancellation email failed:', err)
    }

    return apiSuccess({ message: 'Appointment cancelled successfully' })
  }

  // ── Handle other status updates ───────────────────────────────────────────
  const updated = await prisma.appointment.update({
    where: { id },
    data:  { status },
  })

  return apiSuccess({ appointment: updated })
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  // TODO: add admin session check before enabling hard deletes
  return apiError('Hard delete not enabled — use PATCH with status: CANCELLED instead', 405)
}

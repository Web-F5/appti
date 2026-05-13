// src/app/api/appointments/route.ts
// GET  /api/appointments  — list appointments for the authenticated business
// POST /api/appointments  — create a new appointment (called from booking widget)

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAppointment } from '@/lib/appointments/create'
import { z } from 'zod'

// ── Validation ────────────────────────────────────────────────────────────────

const CreateAppointmentSchema = z.object({
  businessSlug:  z.string().min(1),
  serviceId:     z.string().uuid(),
  staffMemberId: z.string().uuid(),
  startsAt:      z.string().datetime(),
  clientName:    z.string().min(1, 'Name is required'),
  clientEmail:   z.string().email('Valid email is required'),
  clientPhone:   z.string().optional(),
  clientNotes:   z.string().max(500).optional(),
})

// ── GET ───────────────────────────────────────────────────────────────────────
// Returns appointments for the authenticated business.
// Query params: status, from (ISO date), to (ISO date), staffMemberId

export async function GET(req: NextRequest) {
  // TODO: replace hardcoded businessId with session lookup once auth is wired
  const { searchParams } = new URL(req.url)
  const businessSlug  = searchParams.get('businessSlug')
  const status        = searchParams.get('status')
  const from          = searchParams.get('from')
  const to            = searchParams.get('to')
  const staffMemberId = searchParams.get('staffMemberId')

  if (!businessSlug) return apiError('Missing businessSlug', 400)

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true },
  })
  if (!business) return apiError('Business not found', 404)

  const appointments = await prisma.appointment.findMany({
    where: {
      service: { businessId: business.id },
      ...(status        ? { status: status as any }         : {}),
      ...(staffMemberId ? { staffMemberId }                  : {}),
      ...(from || to    ? {
        startsAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to)   } : {}),
        },
      } : {}),
    },
    include: {
      service:     { select: { name: true, durationMins: true, color: true } },
      staffMember: { select: { name: true } },
      client:      { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startsAt: 'asc' },
    take: 100,
  })

  return apiSuccess({ appointments, count: appointments.length })
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Public endpoint — called by the client-facing booking widget.
// No auth required — the businessSlug in the payload scopes the request.

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON body', 400) }

  const parsed = CreateAppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.errors[0].message, 422)
  }

  const result = await createAppointment(parsed.data)

  if (!result.success) {
    // Map error codes to appropriate HTTP status codes
    const status =
      result.code === 'SLOT_UNAVAILABLE' ? 409 :
      result.code === 'SLOT_TOO_SOON'    ? 422 :
      result.code === 'BUSINESS_NOT_FOUND' ||
      result.code === 'SERVICE_NOT_FOUND' ||
      result.code === 'STAFF_NOT_FOUND'  ? 404 : 500

    return apiError(result.error, status, result.code)
  }

  return apiSuccess(
    {
      appointmentId: result.appointmentId,
      startsAt:      result.startsAt.toISOString(),
      endsAt:        result.endsAt.toISOString(),
      message:       'Appointment confirmed. Check your email for details.',
    },
    201
  )
}

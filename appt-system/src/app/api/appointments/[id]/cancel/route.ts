// src/app/api/appointments/[id]/cancel/route.ts
// GET  — verify token and return appointment details for confirmation screen
// POST — cancel the appointment if token is valid

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

function verifyToken(token: string, appointmentId: string, createdAt: Date): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    // Token must contain the appointment ID and a timestamp within 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    return (
      decoded.id === appointmentId &&
      typeof decoded.ts === 'number' &&
      Date.now() - decoded.ts < maxAge
    )
  } catch {
    return false
  }
}

// GET — load appointment details for the confirmation screen
export async function GET(req: NextRequest, { params }: Params) {
  const { id }  = await params
  const token   = req.nextUrl.searchParams.get('token') ?? ''

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service:     { select: { name: true } },
      client:      { select: { name: true, email: true } },
      staffMember: { select: { name: true } },
      business:    { select: { name: true, slug: true } },
    },
  })

  if (!appt) return apiError('Appointment not found', 404)
  if (appt.status === 'CANCELLED') return apiError('This appointment has already been cancelled', 400)
  if (!verifyToken(token, id, appt.createdAt)) return apiError('Invalid or expired cancellation link', 403)

  return apiSuccess({
    serviceName:  appt.service.name,
    businessName: business?.name ?? 'the business',
    staffName:    appt.staffMember.name,
    startsAt:     appt.startsAt.toISOString(),
    status:       appt.status,
  })
}

// POST — perform the cancellation
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  let body: { token?: string }
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const token = body.token ?? ''

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      business: { select: { name: true, slug: true } },
      client:   { select: { name: true, email: true } },
      service:  { select: { name: true } },
    },
  })

  if (!appt) return apiError('Appointment not found', 404)
  if (appt.status === 'CANCELLED') return apiError('Already cancelled', 400)
  if (!verifyToken(token, id, appt.createdAt)) return apiError('Invalid or expired cancellation link', 403)

  await prisma.appointment.update({
    where: { id },
    data:  { status: 'CANCELLED' },
  })

  console.log(`[cancel] Appointment ${id} cancelled by client via token`)

  return apiSuccess({ cancelled: true, businessName: business?.name ?? 'the business' })
}

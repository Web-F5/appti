// src/app/api/services/[id]/route.ts
// GET    /api/services/:id  — get a service
// PATCH  /api/services/:id  — update a service
// DELETE /api/services/:id  — delete a service

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  name:         z.string().min(1).optional(),
  description:  z.string().nullable().optional(),
  durationMins: z.number().int().min(5).max(480).optional(),
  price:        z.number().min(0).nullable().optional(),
  color:        z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  isActive:     z.boolean().optional(),
  staffIds:     z.array(z.string().uuid()).optional(),
})

async function getServiceForBusiness(id: string, businessSlug: string) {
  return prisma.service.findFirst({
    where: { id, business: { slug: businessSlug } },
  })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const service = await getServiceForBusiness(id, session.user.businessSlug)
  if (!service) return apiError('Service not found', 404)

  return apiSuccess({ service })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const existing = await getServiceForBusiness(id, session.user.businessSlug)
  if (!existing) return apiError('Service not found', 404)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const { staffIds, ...serviceData } = parsed.data

  const service = await prisma.$transaction(async (tx) => {
    // Update staff links if provided
    if (staffIds !== undefined) {
      await tx.staffService.deleteMany({ where: { serviceId: id } })
      if (staffIds.length > 0) {
        await tx.staffService.createMany({
          data: staffIds.map(staffMemberId => ({ staffMemberId, serviceId: id })),
        })
      }
    }

    return tx.service.update({
      where: { id },
      data: serviceData,
    })
  })

  return apiSuccess({ service })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const existing = await getServiceForBusiness(id, session.user.businessSlug)
  if (!existing) return apiError('Service not found', 404)

  // Check for future appointments
  const futureAppts = await prisma.appointment.count({
    where: {
      serviceId: id,
      status: { in: ['CONFIRMED', 'PENDING'] },
      startsAt: { gte: new Date() },
    },
  })

  if (futureAppts > 0) {
    return apiError(
      `Cannot delete — this service has ${futureAppts} upcoming appointment(s). Deactivate it instead.`,
      409
    )
  }

  await prisma.service.delete({ where: { id } })
  return apiSuccess({ message: 'Service deleted' })
}

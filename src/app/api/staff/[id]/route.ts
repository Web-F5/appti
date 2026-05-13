// src/app/api/staff/[id]/route.ts
// GET    /api/staff/:id  — get a staff member
// PATCH  /api/staff/:id  — update a staff member
// DELETE /api/staff/:id  — delete a staff member

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const AvailabilityRuleSchema = z.object({
  dayOfWeek: z.enum(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/),
})

const PatchSchema = z.object({
  name:              z.string().min(1).optional(),
  email:             z.string().email().optional(),
  phone:             z.string().nullable().optional(),
  isActive:          z.boolean().optional(),
  serviceIds:        z.array(z.string().uuid()).optional(),
  availabilityRules: z.array(AvailabilityRuleSchema).optional(),
})

async function getStaffForBusiness(id: string, businessSlug: string) {
  return prisma.staffMember.findFirst({
    where: { id, business: { slug: businessSlug } },
  })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const staff = await getStaffForBusiness(id, session.user.businessSlug)
  if (!staff) return apiError('Staff member not found', 404)

  const full = await prisma.staffMember.findUnique({
    where: { id },
    include: {
      availabilityRules: true,
      staffServices: { include: { service: true } },
    },
  })

  return apiSuccess({ staff: full })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const existing = await getStaffForBusiness(id, session.user.businessSlug)
  if (!existing) return apiError('Staff member not found', 404)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const { serviceIds, availabilityRules, ...staffData } = parsed.data

  const staff = await prisma.$transaction(async (tx) => {
    // Replace availability rules if provided
    if (availabilityRules !== undefined) {
      await tx.availabilityRule.deleteMany({ where: { staffMemberId: id } })
      if (availabilityRules.length > 0) {
        await tx.availabilityRule.createMany({
          data: availabilityRules.map(rule => ({ ...rule, staffMemberId: id })),
        })
      }
    }

    // Replace service links if provided
    if (serviceIds !== undefined) {
      await tx.staffService.deleteMany({ where: { staffMemberId: id } })
      if (serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: serviceIds.map(serviceId => ({ staffMemberId: id, serviceId })),
        })
      }
    }

    return tx.staffMember.update({
      where: { id },
      data: staffData,
    })
  })

  return apiSuccess({ staff })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const existing = await getStaffForBusiness(id, session.user.businessSlug)
  if (!existing) return apiError('Staff member not found', 404)

  const futureAppts = await prisma.appointment.count({
    where: {
      staffMemberId: id,
      status: { in: ['CONFIRMED', 'PENDING'] },
      startsAt: { gte: new Date() },
    },
  })

  if (futureAppts > 0) {
    return apiError(
      `Cannot delete — this staff member has ${futureAppts} upcoming appointment(s). Deactivate them instead.`,
      409
    )
  }

  await prisma.staffMember.delete({ where: { id } })
  return apiSuccess({ message: 'Staff member deleted' })
}

// src/app/api/staff/route.ts
// GET  /api/staff  — list staff for the authenticated business
// POST /api/staff  — create a new staff member

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

const AvailabilityRuleSchema = z.object({
  dayOfWeek: z.enum(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/),
})

const StaffSchema = z.object({
  name:              z.string().min(1, 'Name is required'),
  email:             z.string().email('Valid email is required'),
  phone:             z.string().nullable().optional(),
  isActive:          z.boolean().default(true),
  serviceIds:        z.array(z.string().uuid()).optional(),
  availabilityRules: z.array(AvailabilityRuleSchema).optional(),
})

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    select: { id: true },
  })
  if (!business) return apiError('Business not found', 404)

  const staff = await prisma.staffMember.findMany({
    where: { businessId: business.id },
    include: {
      availabilityRules: { orderBy: { dayOfWeek: 'asc' } },
      staffServices: { include: { service: { select: { id: true, name: true, color: true } } } },
      _count: { select: { appointments: true } },
    },
    orderBy: { name: 'asc' },
  })

  return apiSuccess({ staff })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    select: { id: true },
  })
  if (!business) return apiError('Business not found', 404)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = StaffSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const { serviceIds, availabilityRules, ...staffData } = parsed.data

  const staff = await prisma.staffMember.create({
    data: {
      ...staffData,
      businessId: business.id,
      ...(availabilityRules?.length ? {
        availabilityRules: { create: availabilityRules },
      } : {}),
      ...(serviceIds?.length ? {
        staffServices: {
          create: serviceIds.map(serviceId => ({ serviceId })),
        },
      } : {}),
    },
  })

  return apiSuccess({ staff }, 201)
}

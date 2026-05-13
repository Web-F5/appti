// src/app/api/services/route.ts
// GET  /api/services  — list services for the authenticated business
// POST /api/services  — create a new service

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

const ServiceSchema = z.object({
  name:         z.string().min(1, 'Name is required'),
  description:  z.string().nullable().optional(),
  durationMins: z.number().int().min(5).max(480),
  price:        z.number().min(0).nullable().optional(),
  color:        z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isActive:     z.boolean().default(true),
  staffIds:     z.array(z.string().uuid()).optional(),
})

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    select: { id: true },
  })
  if (!business) return apiError('Business not found', 404)

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    include: {
      staffServices: { include: { staffMember: { select: { id: true, name: true } } } },
      _count: { select: { appointments: true } },
    },
    orderBy: { name: 'asc' },
  })

  return apiSuccess({ services })
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

  const parsed = ServiceSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const { staffIds, ...serviceData } = parsed.data

  const service = await prisma.service.create({
    data: {
      ...serviceData,
      businessId: business.id,
      ...(staffIds?.length ? {
        staffServices: {
          create: staffIds.map(staffMemberId => ({ staffMemberId })),
        },
      } : {}),
    },
  })

  return apiSuccess({ service }, 201)
}

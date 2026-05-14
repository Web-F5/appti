// src/app/api/reminders/route.ts
// POST /api/reminders — create a new reminder template

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

const Schema = z.object({
  channel:      z.enum(['SMS', 'EMAIL']),
  offsetMins:   z.number().int().min(1),
  subject:      z.string().nullable().optional(),
  bodyTemplate: z.string().min(1),
  isActive:     z.boolean().default(true),
})

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

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const template = await prisma.reminderTemplate.create({
    data: { ...parsed.data, businessId: business.id },
  })

  return apiSuccess({ template }, 201)
}

// src/app/api/businesses/[slug]/route.ts
// GET   /api/businesses/:slug  — get business details
// PATCH /api/businesses/:slug  — update business profile and booking settings

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

type Params = { params: Promise<{ slug: string }> }

const PatchSchema = z.object({
  name:             z.string().min(1).optional(),
  timezone:         z.string().optional(),
  logoUrl:          z.string().url().nullable().optional(),
  primaryColor:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  websiteUrl:       z.string().url().nullable().optional(),
  bookingLeadHours: z.number().int().min(0).max(72).optional(),
  bookingMaxDays:   z.number().int().min(1).max(365).optional(),
  requiresConfirm:  z.boolean().optional(),
  allowClientCancel: z.boolean().optional(),
  cancelLeadHours:  z.number().int().min(0).optional(),
})

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { slug } = await params
  if (slug !== session.user.businessSlug) return apiError('Forbidden', 403)

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { reminderTemplates: { orderBy: { channel: 'asc' } } },
  })

  if (!business) return apiError('Business not found', 404)
  return apiSuccess({ business })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { slug } = await params
  if (slug !== session.user.businessSlug) return apiError('Forbidden', 403)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const business = await prisma.business.update({
    where: { slug },
    data: parsed.data,
  })

  return apiSuccess({ business })
}

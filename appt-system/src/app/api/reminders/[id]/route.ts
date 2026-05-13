// src/app/api/reminders/[id]/route.ts
// PATCH  /api/reminders/:id  — update a reminder template
// DELETE /api/reminders/:id  — delete a reminder template

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const PatchSchema = z.object({
  offsetMins:   z.number().int().min(1).optional(),
  subject:      z.string().nullable().optional(),
  bodyTemplate: z.string().min(1).optional(),
  isActive:     z.boolean().optional(),
})

async function getTemplateForBusiness(id: string, businessSlug: string) {
  return prisma.reminderTemplate.findFirst({
    where: { id, business: { slug: businessSlug } },
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const existing = await getTemplateForBusiness(id, session.user.businessSlug)
  if (!existing) return apiError('Reminder template not found', 404)

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const template = await prisma.reminderTemplate.update({
    where: { id },
    data: parsed.data,
  })

  return apiSuccess({ template })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const { id } = await params
  const existing = await getTemplateForBusiness(id, session.user.businessSlug)
  if (!existing) return apiError('Reminder template not found', 404)

  await prisma.reminderTemplate.delete({ where: { id } })
  return apiSuccess({ message: 'Reminder template deleted' })
}

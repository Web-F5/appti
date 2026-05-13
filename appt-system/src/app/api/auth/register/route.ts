// src/app/api/auth/register/route.ts
// POST /api/auth/register — creates a new user account and business.

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/utils'
import { z } from 'zod'

const RegisterSchema = z.object({
  name:         z.string().min(1, 'Name is required'),
  email:        z.string().email('Valid email is required'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  timezone:     z.string().default('Australia/Melbourne'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message, 422)

  const { name, email, password, businessName, timezone } = parsed.data

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (existing) return apiError('An account with this email already exists', 409)

  // Generate business slug from name
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  // Ensure slug is unique
  let slug = baseSlug
  let suffix = 1
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  // Create business and user in one transaction
  const user = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name:     businessName,
        slug,
        timezone,
        // Default reminder templates
        reminderTemplates: {
          create: [
            {
              channel:      'EMAIL',
              offsetMins:   1440,
              subject:      'Reminder: Your appointment tomorrow with {{business_name}}',
              bodyTemplate: 'Hi {{client_name}},\n\nThis is a reminder that you have an appointment for {{service_name}} tomorrow at {{time}}.\n\nNeed to cancel? {{cancel_url}}\n\nSee you soon,\n{{business_name}}',
              isActive:     true,
            },
            {
              channel:      'SMS',
              offsetMins:   60,
              bodyTemplate: 'Reminder: {{service_name}} with {{business_name}} in 1 hour at {{time}}. Cancel: {{cancel_url}}',
              isActive:     true,
            },
          ],
        },
      },
    })

    const newUser = await tx.user.create({
      data: {
        name,
        email:          email.toLowerCase().trim(),
        hashedPassword,
        businessId:     business.id,
        role:           'OWNER',
      },
    })

    return newUser
  })

  return apiSuccess({ userId: user.id, message: 'Account created successfully' }, 201)
}

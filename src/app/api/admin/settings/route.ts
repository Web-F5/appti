// src/app/api/admin/settings/route.ts
// GET  — get current admin alert settings
// POST — update admin alert email list (stored in database on business record for now)

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return apiError('Unauthorised', 401)

  const raw = process.env.ADMIN_ALERT_EMAILS ?? 'admin@appti.net'
  const emails = raw.split(',').map(e => e.trim()).filter(Boolean)

  return apiSuccess({
    alertEmails: emails,
    workerTimeoutMins: Number(process.env.WORKER_TIMEOUT_MINS ?? 10),
    healthCheckToken: process.env.HEALTH_CHECK_TOKEN ? '••••••••' : null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  })
}

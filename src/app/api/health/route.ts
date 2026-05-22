// src/app/api/health/route.ts
// GET /api/health — checks all critical services and returns status
// Used by admin dashboard and external uptime monitors

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'
import { redis } from '@/lib/bullmq/queues'

export const dynamic = 'force-dynamic'

export type ServiceStatus = 'ok' | 'warn' | 'error'

export type HealthReport = {
  status:    ServiceStatus
  timestamp: string
  services: {
    database: { status: ServiceStatus; latencyMs?: number; error?: string }
    redis:    { status: ServiceStatus; latencyMs?: number; error?: string }
    worker:   { status: ServiceStatus; lastHeartbeat?: string; minutesSince?: number; error?: string }
    queue:    { status: ServiceStatus; waiting?: number; failed?: number; error?: string }
  }
}

async function checkDatabase(): Promise<HealthReport['services']['database']> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function checkRedis(): Promise<HealthReport['services']['redis']> {
  const start = Date.now()
  try {
    await redis.ping()
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function checkWorker(): Promise<HealthReport['services']['worker']> {
  const timeoutMins = Number(process.env.WORKER_TIMEOUT_MINS ?? 10)
  try {
    const heartbeat = await redis.get('worker:heartbeat')
    if (!heartbeat) {
      return { status: 'warn', error: 'No heartbeat recorded yet — worker may not have started' }
    }
    const lastBeat    = new Date(heartbeat)
    const minutesSince = Math.floor((Date.now() - lastBeat.getTime()) / 60000)
    const status: ServiceStatus = minutesSince > timeoutMins ? 'error'
      : minutesSince > timeoutMins / 2 ? 'warn'
      : 'ok'
    return { status, lastHeartbeat: lastBeat.toISOString(), minutesSince }
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Redis error' }
  }
}

async function checkQueue(): Promise<HealthReport['services']['queue']> {
  try {
    // BullMQ v5 uses sorted sets for waiting and failed jobs
    const [waiting, failed] = await Promise.all([
      redis.zcard('bull:reminders:wait'),
      redis.zcard('bull:reminders:failed'),
    ])
    const status: ServiceStatus = failed > 10 ? 'error' : failed > 0 ? 'warn' : 'ok'
    return { status, waiting, failed }
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Redis error' }
  }
}

function overallStatus(services: HealthReport['services']): ServiceStatus {
  const statuses = Object.values(services).map(s => s.status)
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('warn'))  return 'warn'
  return 'ok'
}

export async function GET(req: NextRequest) {
  // Allow unauthenticated access for external uptime monitors via token
  const token   = req.nextUrl.searchParams.get('token')
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER'
  const hasToken = token === process.env.HEALTH_CHECK_TOKEN

  // Public endpoint returns minimal status only
  // Full details require auth or token
  const fullDetails = isAdmin || hasToken

  const [database, redisCheck, worker, queue] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkWorker(),
    checkQueue(),
  ])

  const services = { database, redis: redisCheck, worker, queue }
  const status   = overallStatus(services)

  const report: HealthReport = {
    status,
    timestamp: new Date().toISOString(),
    services: fullDetails ? services : {
      database: { status: services.database.status },
      redis:    { status: services.redis.status },
      worker:   { status: services.worker.status },
      queue:    { status: services.queue.status },
    },
  }

  return Response.json(report, {
    status: status === 'error' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
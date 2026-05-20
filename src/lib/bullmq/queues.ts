// src/lib/bullmq/queues.ts
// BullMQ queue definitions and job type contracts.
// The worker (workers/reminder.worker.ts) processes these jobs.

import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'

// ── Redis connection ──────────────────────────────────────────────────────────

export const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
})

// ── Raw Redis client for health checks and heartbeat ─────────────────────────

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
})

// ── Job data types ────────────────────────────────────────────────────────────

export type ReminderJobData = {
  reminderId: string
  appointmentId: string
  businessId: string
  channel: 'SMS' | 'EMAIL'
  to: string          // phone number or email address
  body: string        // pre-rendered message body
  subject?: string    // email subject (email only)
}

// ── Queue definitions ─────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  REMINDERS: 'reminders',
  CALENDAR_SYNC: 'calendar-sync',
  USAGE_BILLING: 'usage-billing',
} as const

/** The main reminder queue — jobs are delayed until scheduledFor time */
export const reminderQueue = new Queue<ReminderJobData>(QUEUE_NAMES.REMINDERS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
})

// ── Queue helpers ─────────────────────────────────────────────────────────────

/**
 * Schedule a reminder job to fire at a specific time.
 * Returns the BullMQ job ID so it can be stored and later cancelled.
 */
export async function scheduleReminder(
  data: ReminderJobData,
  fireAt: Date
): Promise<string> {
  const delay = fireAt.getTime() - Date.now()

  // If delay is negative the appointment is in the past — skip
  if (delay < 0) {
    console.warn(`[BullMQ] Skipping past reminder for appointment ${data.appointmentId}`)
    return ''
  }

  const job = await reminderQueue.add('send-reminder', data, {
    delay,
    jobId: `reminder-${data.reminderId}`, // idempotent — safe to call twice
  })

  return job.id ?? ''
}

/**
 * Cancel a scheduled reminder job by its BullMQ job ID.
 * Safe to call even if the job has already fired.
 */
export async function cancelReminder(jobId: string): Promise<void> {
  if (!jobId) return
  try {
    const job = await Job.fromId(reminderQueue, jobId)
    if (job) await job.remove()
  } catch {
    // Job may have already fired or been removed — not an error
  }
}

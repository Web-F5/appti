// workers/reminder.worker.ts
// Long-running process that consumes the BullMQ reminder queue.
// Run in a separate process: npm run worker:dev
//
// This runs OUTSIDE of Next.js — it's a plain Node process.
// Deploy it on Railway, Fly.io, or a small VPS alongside your Next.js app.

import { Worker, Job } from 'bullmq'
import { prisma } from '../src/lib/prisma/client'
import { sendSms } from '../src/lib/mobilemessage/client'
import { sendEmail } from '../src/lib/resend/client'
import { redisConnection, QUEUE_NAMES, type ReminderJobData } from '../src/lib/bullmq/queues'
import { getRateForPlan } from '../src/lib/stripe/client'

const worker = new Worker<ReminderJobData>(
  QUEUE_NAMES.REMINDERS,
  async (job: Job<ReminderJobData>) => {
    const { reminderId, businessId, channel, to, body, subject } = job.data

    console.log(`[Worker] Processing reminder ${reminderId} via ${channel} to ${to}`)

    // Fetch the business to get their current plan (for billing rate)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: true, creditBalance: true },
    })

    if (!business) {
      throw new Error(`Business ${businessId} not found`)
    }

    // Determine cost based on plan
    const cost = getRateForPlan(business.plan, channel === 'SMS' ? 'sms' : 'email')

    // Check credit balance (PAYG only — subscriptions have included bundles)
    // TODO: For STARTER/PRO, check included bundle before deducting credits
    if (business.plan === 'PAYG' && Number(business.creditBalance) < cost) {
      console.warn(`[Worker] Insufficient credits for business ${businessId} — skipping reminder`)
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'FAILED', failureReason: 'Insufficient credit balance' },
      })
      return
    }

    // Send the message
    const result =
      channel === 'SMS'
        ? await sendSms(to, body)
        : await sendEmail(to, subject ?? 'Appointment Reminder', body)

    const now = new Date()

    if (result.success) {
      // Update reminder to SENT
      await prisma.reminder.update({
        where: { id: reminderId },
        data: {
          status: 'SENT',
          firedAt: now,
          providerMsgId: result.providerMsgId,
        },
      })

      // Deduct from credit balance and log usage event
      await prisma.$transaction([
        prisma.business.update({
          where: { id: businessId },
          data: { creditBalance: { decrement: cost } },
        }),
        prisma.usageEvent.create({
          data: {
            businessId,
            reminderId,
            eventType: channel === 'SMS' ? 'SMS_SENT' : 'EMAIL_SENT',
            cost,
            baseRate: cost,
          },
        }),
      ])

      console.log(`[Worker] Reminder ${reminderId} sent successfully`)
    } else {
      // Log failure — no charge
      await prisma.reminder.update({
        where: { id: reminderId },
        data: {
          status: 'FAILED',
          firedAt: now,
          failureReason: result.error,
        },
      })

      await prisma.usageEvent.create({
        data: {
          businessId,
          reminderId,
          eventType: channel === 'SMS' ? 'SMS_FAILED' : 'EMAIL_FAILED',
          cost: 0,
          baseRate: cost,
        },
      })

      console.error(`[Worker] Reminder ${reminderId} failed: ${result.error}`)
      throw new Error(result.error) // triggers BullMQ retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // process up to 5 reminders simultaneously
  }
)

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err)
})

console.log('[Worker] Reminder worker started — waiting for jobs...')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})

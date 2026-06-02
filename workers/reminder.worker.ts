// workers/reminder.worker.ts
// Long-running process that consumes the BullMQ reminder queue.
// Run in a separate process: npm run worker:dev

import { Worker, Job } from 'bullmq'
import { prisma } from '../src/lib/prisma/client'
import { sendSms } from '../src/lib/mobilemessage/client'
import { sendEmail } from '../src/lib/resend/client'
import { redisConnection, QUEUE_NAMES, type ReminderJobData, redis } from '../src/lib/bullmq/queues'
import { getRateForPlan } from '../src/lib/stripe/client'
import { PLAN_CONFIG } from '../src/types'


// ── Bundle usage helper ───────────────────────────────────────────────────────

/**
 * Count how many SMS or emails have been sent this billing month for a business.
 * "Billing month" = from planRenewsAt minus one month, or start of calendar month
 * for PAYG (no subscription cycle).
 */
async function getBundleUsedThisMonth(
  businessId: string,
  channel: 'SMS' | 'EMAIL',
  planRenewsAt: Date | null
): Promise<number> {
  // Determine start of current billing cycle
  let cycleStart: Date
  if (planRenewsAt) {
    // Work backwards one month from renewal date to find cycle start
    cycleStart = new Date(planRenewsAt)
    cycleStart.setMonth(cycleStart.getMonth() - 1)
  } else {
    // PAYG — use calendar month
    const now = new Date()
    cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const eventType = channel === 'SMS' ? 'SMS_SENT' : 'EMAIL_SENT'

  const count = await prisma.usageEvent.count({
    where: {
      businessId,
      eventType,
      createdAt: { gte: cycleStart },
    },
  })

  return count
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEALTH_CHECK_INTERVAL_MINS ?? 5) * 60 * 1000

async function writeHeartbeat() {
  try {
    await redis.set('worker:heartbeat', new Date().toISOString(), 'EX', 3600)
    console.log('[Worker] Heartbeat written:', new Date().toISOString())
  } catch (err) {
    console.error('[Worker] Failed to write heartbeat:', err)
  }
}

writeHeartbeat()
setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS)

// ── Worker ────────────────────────────────────────────────────────────────────

const worker = new Worker<ReminderJobData>(
  QUEUE_NAMES.REMINDERS,
  async (job: Job<ReminderJobData>) => {
    const { reminderId, businessId, channel, to, body, subject } = job.data

    console.log(`[Worker] Processing reminder ${reminderId} via ${channel} to ${to}`)

    // Fetch business — need plan, balance, and renewal date for bundle calculation
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: true, creditBalance: true, planRenewsAt: true },
    })

    if (!business) throw new Error(`Business ${businessId} not found`)

    const planConfig = PLAN_CONFIG[business.plan]
    const channelKey = channel === 'SMS' ? 'sms' : 'email'

    // ── Determine if this message is covered by the bundle ──────────────────
    const bundleLimit = channel === 'SMS'
      ? planConfig.includedSms
      : planConfig.includedEmail

    let cost = 0
    let coveredByBundle = false

    if (bundleLimit > 0) {
      // Check how many have been sent this billing cycle
      const usedThisMonth = await getBundleUsedThisMonth(
        businessId,
        channel,
        business.planRenewsAt
      )

      if (usedThisMonth < bundleLimit) {
        // Still within bundle — free
        coveredByBundle = true
        cost = 0
        console.log(`[Worker] Message covered by bundle (${usedThisMonth + 1}/${bundleLimit} ${channel})`)
      } else {
        // Over bundle — charge overage rate
        cost = getRateForPlan(business.plan, channelKey)
        console.log(`[Worker] Bundle exhausted (${usedThisMonth}/${bundleLimit}), charging overage: $${cost}`)
      }
    } else {
      // PAYG — always charge
      cost = getRateForPlan(business.plan, channelKey)
    }

    // ── Check credit balance if there's a charge ────────────────────────────
    if (cost > 0 && Number(business.creditBalance) < cost) {
      console.warn(`[Worker] Insufficient credits ($${business.creditBalance}) for $${cost} charge — skipping`)
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'FAILED', failureReason: 'Insufficient credit balance' },
      })
      return
    }

    // ── Send the message ────────────────────────────────────────────────────
    // For email, convert the cancel URL into a clickable HTML button
    const htmlBody = channel === 'EMAIL'
      ? body.replace(
          /(https:\/\/[^\s]+\/appointments\/[^\s]+\/cancel[^\s]*)/g,
          '<br /><br /><a href="$1" style="display:inline-block;padding:10px 20px;background-color:#DC2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Cancel this appointment</a>'
        )
      : body

    const result = channel === 'SMS'
      ? await sendSms(to, body)
      : await sendEmail(to, subject ?? 'Appointment Reminder', body, htmlBody)


    const now = new Date()

    if (result.success) {
      // Update reminder status
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'SENT', firedAt: now, providerMsgId: result.providerMsgId },
      })

      // Log usage event and deduct credit if applicable
      await prisma.$transaction([
        // Only deduct from balance if there was a charge
        ...(cost > 0 ? [
          prisma.business.update({
            where: { id: businessId },
            data: { creditBalance: { decrement: cost } },
          }),
        ] : []),
        prisma.usageEvent.create({
          data: {
            businessId,
            reminderId,
            eventType: channel === 'SMS' ? 'SMS_SENT' : 'EMAIL_SENT',
            cost,        // 0 if covered by bundle, overage rate if exhausted
            baseRate: getRateForPlan(business.plan, channelKey),
          },
        }),
      ])

      console.log(`[Worker] Reminder ${reminderId} sent. Cost: $${cost} (bundle: ${coveredByBundle})`)
    } else {
      // Log failure — no charge
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'FAILED', firedAt: now, failureReason: result.error },
      })

      await prisma.usageEvent.create({
        data: {
          businessId,
          reminderId,
          eventType: channel === 'SMS' ? 'SMS_FAILED' : 'EMAIL_FAILED',
          cost: 0,
          baseRate: getRateForPlan(business.plan, channelKey),
        },
      })

      console.error(`[Worker] Reminder ${reminderId} failed: ${result.error}`)
      throw new Error(result.error) // triggers BullMQ retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    stalledInterval:  60_000,   // check for stalled jobs every 30s (default: 5s)
    lockDuration:     60_000,   // job lock duration
    skipLockRenewal:  false,
    drainDelay:       60,      // wait 30s between checks when queue is empty (default: 5s)
  }
)

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message))
worker.on('error', (err) => console.error('[Worker] Worker error:', err))

console.log('[Worker] Reminder worker started — waiting for jobs...')

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...')
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})

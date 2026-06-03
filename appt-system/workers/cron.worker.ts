// workers/cron.worker.ts
// Cron-based reminder sender — polls the database every minute for due reminders.
// Simpler and cheaper than BullMQ at low volume — no Redis queue needed.
// To switch back to BullMQ later: change Railway start command to reminder.worker.ts
//
// Start command: npx tsx workers/cron.worker.ts

import { prisma } from '../src/lib/prisma/client'
import { sendSms } from '../src/lib/mobilemessage/client'
import { sendEmail } from '../src/lib/resend/client'
import { getRateForPlan } from '../src/lib/stripe/client'
import { PLAN_CONFIG } from '../src/types'

const POLL_INTERVAL_MS  = 60_000   // run every 60 seconds
const LOOK_AHEAD_SECS   = 70       // pick up reminders due in the next 70s (overlap to avoid gaps)
const HEARTBEAT_KEY     = 'cron-worker:heartbeat'

// ── Heartbeat ─────────────────────────────────────────────────────────────────
// Writes heartbeat to the database instead of Redis.
// The health check reads this to confirm the worker is alive.

async function writeHeartbeat() {
  try {
    await prisma.$executeRaw`
      INSERT INTO worker_heartbeat (id, last_seen)
      VALUES (1, NOW())
      ON CONFLICT (id) DO UPDATE SET last_seen = NOW()
    `
    console.log('[Cron] Heartbeat written:', new Date().toISOString())
  } catch (err) {
    // Fallback — just log, don't crash
    console.warn('[Cron] Heartbeat write failed (table may not exist yet):', err instanceof Error ? err.message : err)
  }
}

// ── Bundle usage helper ───────────────────────────────────────────────────────

async function getBundleUsedThisMonth(
  businessId:   string,
  channel:      'SMS' | 'EMAIL',
  planRenewsAt: Date | null
): Promise<number> {
  let cycleStart: Date
  if (planRenewsAt) {
    cycleStart = new Date(planRenewsAt)
    cycleStart.setMonth(cycleStart.getMonth() - 1)
  } else {
    const now  = new Date()
    cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const eventType = channel === 'SMS' ? 'SMS_SENT' : 'EMAIL_SENT'
  return prisma.usageEvent.count({
    where: { businessId, eventType, createdAt: { gte: cycleStart } },
  })
}

// ── Send one reminder ─────────────────────────────────────────────────────────

async function processReminder(reminder: {
  id:         string
  channel:    string
  to:         string
  body:       string
  subject:    string | null
  businessId: string
  business: {
    plan:          string
    creditBalance: unknown
    planRenewsAt:  Date | null
  }
}) {
  const channel    = reminder.channel as 'SMS' | 'EMAIL'
  const business   = reminder.business
  const planConfig = PLAN_CONFIG[business.plan as keyof typeof PLAN_CONFIG]
  const channelKey = channel === 'SMS' ? 'sms' : 'email'

  // ── Bundle check ────────────────────────────────────────────────────────────
  const bundleLimit = channel === 'SMS'
    ? planConfig.includedSms
    : planConfig.includedEmail

  let cost            = 0
  let coveredByBundle = false

  if (bundleLimit > 0) {
    const usedThisMonth = await getBundleUsedThisMonth(
      reminder.businessId, channel, business.planRenewsAt
    )
    if (usedThisMonth < bundleLimit) {
      coveredByBundle = true
      cost = 0
      console.log(`[Cron] Bundle covers this message (${usedThisMonth + 1}/${bundleLimit} ${channel})`)
    } else {
      cost = getRateForPlan(business.plan, channelKey)
      console.log(`[Cron] Bundle exhausted, charging overage: $${cost}`)
    }
  } else {
    cost = getRateForPlan(business.plan, channelKey)
  }

  // ── Credit check ────────────────────────────────────────────────────────────
  if (cost > 0 && Number(business.creditBalance) < cost) {
    console.warn(`[Cron] Insufficient credits for reminder ${reminder.id} — marking failed`)
    await prisma.reminder.update({
      where: { id: reminder.id },
      data:  { status: 'FAILED', failureReason: 'Insufficient credit balance', firedAt: new Date() },
    })
    return
  }

  // ── Mark as processing (prevents duplicate sends on overlap) ────────────────
  const claimed = await prisma.reminder.updateMany({
    where: { id: reminder.id, status: 'PENDING' },
    data:  { status: 'PROCESSING' },
  })
  if (claimed.count === 0) {
    console.log(`[Cron] Reminder ${reminder.id} already claimed by another process — skipping`)
    return
  }

  // ── Send ────────────────────────────────────────────────────────────────────
  const htmlBody = channel === 'EMAIL'
    ? reminder.body.replace(
        /(https:\/\/[^\s]+\/appointments\/[^\s]+\/cancel[^\s]*)/g,
        '<br /><br /><a href="$1" style="display:inline-block;padding:10px 20px;background-color:#DC2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">Cancel this appointment</a>'
      )
    : reminder.body

  const result = channel === 'SMS'
    ? await sendSms(reminder.to, reminder.body)
    : await sendEmail(reminder.to, reminder.subject ?? 'Appointment Reminder', reminder.body, htmlBody)

  const now = new Date()

  if (result.success) {
    await prisma.$transaction([
      prisma.reminder.update({
        where: { id: reminder.id },
        data:  { status: 'SENT', firedAt: now, providerMsgId: result.providerMsgId },
      }),
      ...(cost > 0 ? [
        prisma.business.update({
          where: { id: reminder.businessId },
          data:  { creditBalance: { decrement: cost } },
        }),
      ] : []),
      prisma.usageEvent.create({
        data: {
          businessId: reminder.businessId,
          reminderId: reminder.id,
          eventType:  channel === 'SMS' ? 'SMS_SENT' : 'EMAIL_SENT',
          cost,
          baseRate:   getRateForPlan(business.plan, channelKey),
        },
      }),
    ])
    console.log(`[Cron] ✓ Reminder ${reminder.id} sent via ${channel}. Cost: $${cost} (bundle: ${coveredByBundle})`)
  } else {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data:  { status: 'FAILED', firedAt: now, failureReason: result.error },
    })
    await prisma.usageEvent.create({
      data: {
        businessId: reminder.businessId,
        reminderId: reminder.id,
        eventType:  channel === 'SMS' ? 'SMS_FAILED' : 'EMAIL_FAILED',
        cost:       0,
        baseRate:   getRateForPlan(business.plan, channelKey),
      },
    })
    console.error(`[Cron] ✗ Reminder ${reminder.id} failed: ${result.error}`)
  }
}

// ── Main poll loop ────────────────────────────────────────────────────────────

async function poll() {
  const now     = new Date()
  const horizon = new Date(now.getTime() + LOOK_AHEAD_SECS * 1000)

  console.log(`[Cron] Polling at ${now.toISOString()}`)

  try {
    // Find all reminders due within the next LOOK_AHEAD_SECS seconds
    const reminders = await prisma.reminder.findMany({
      where: {
        status:       'PENDING',
        scheduledFor: { lte: horizon },
      },
      include: {
        business: {
          select: { plan: true, creditBalance: true, planRenewsAt: true },
        },
      },
      take: 50, // process max 50 per poll to avoid timeout
    })

    if (reminders.length === 0) {
      console.log('[Cron] No reminders due')
      return
    }

    console.log(`[Cron] Found ${reminders.length} reminder(s) to process`)

    // Process concurrently but with a limit
    const CONCURRENCY = 5
    for (let i = 0; i < reminders.length; i += CONCURRENCY) {
      const batch = reminders.slice(i, i + CONCURRENCY)
      await Promise.allSettled(batch.map(r => processReminder(r as any)))
    }
  } catch (err) {
    console.error('[Cron] Poll error:', err instanceof Error ? err.message : err)
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Cron] Reminder cron worker started')
  console.log(`[Cron] Polling every ${POLL_INTERVAL_MS / 1000}s, looking ${LOOK_AHEAD_SECS}s ahead`)

  // Write heartbeat immediately and then every 5 minutes
  await writeHeartbeat()
  setInterval(writeHeartbeat, 5 * 60_000)

  // Run immediately on startup, then on interval
  await poll()
  setInterval(poll, POLL_INTERVAL_MS)
}

main().catch(err => {
  console.error('[Cron] Fatal error:', err)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  console.log('[Cron] Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

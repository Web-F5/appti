// workers/reminder.worker.ts — ADD THESE LINES near the top after existing imports

// ── Heartbeat ─────────────────────────────────────────────────────────────────
// Add this import to your existing imports line:
import { redisConnection, QUEUE_NAMES, type ReminderJobData, redis } from '../src/lib/bullmq/queues'
// (add 'redis' to the existing import — see src/lib/bullmq/queues.ts update below)

const HEARTBEAT_INTERVAL_MS = Number(process.env.HEALTH_CHECK_INTERVAL_MINS ?? 5) * 60 * 1000

async function writeHeartbeat() {
  try {
    await redis.set('worker:heartbeat', new Date().toISOString(), 'EX', 3600)
    console.log('[Worker] Heartbeat written:', new Date().toISOString())
  } catch (err) {
    console.error('[Worker] Failed to write heartbeat:', err)
  }
}

// Write immediately on startup, then every 5 minutes
writeHeartbeat()
setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS)

// ── Also export redis from queues.ts ──────────────────────────────────────────
// In src/lib/bullmq/queues.ts, add this export:
//
// import IORedis from 'ioredis'
// export const redis = new IORedis(process.env.REDIS_URL ?? '', { maxRetriesPerRequest: null })

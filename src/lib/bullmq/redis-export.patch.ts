// PATCH FOR: src/lib/bullmq/queues.ts
// Add this export near the top of the file, after your existing imports.
// This exports the raw IORedis client so the health check and worker
// can use it directly for heartbeat and status checks.

// Add to existing imports:
import IORedis from 'ioredis'

// Add this export after your existing connection setup:
export const redis = new IORedis(process.env.REDIS_URL ?? '', {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
})

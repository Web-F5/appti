import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') })

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

async function main() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) { console.error('REDIS_URL not found in .env.local'); process.exit(1) }

  console.log('Connecting to Redis...')
  const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null })
  const queue = new Queue('reminders', { connection: redis })
  const cleaned = await queue.clean(0, 1000, 'failed')
  console.log(`Cleared ${cleaned.length} failed jobs`)
  await queue.close()
  await redis.quit()
  console.log('Done.')
}

main().catch(console.error)

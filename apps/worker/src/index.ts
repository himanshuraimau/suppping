import { Worker } from 'bullmq'
import { createConnection } from './queues.js'
import { logger } from './logger.js'

// ponytail: stub processors — Phase 3 (reminders) fills these in with real
// DB reads/writes and the WhatsApp send call. This just proves the queues run.
new Worker(
  'reminder-scheduling',
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'reminder-scheduling job received')
  },
  { connection: createConnection() },
)

new Worker(
  'outbound-messages',
  async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'outbound-messages job received')
  },
  { connection: createConnection() },
)

logger.info('worker started, listening on reminder-scheduling and outbound-messages')

import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from './env.js'

// ponytail: each Worker needs its own connection (BullMQ uses blocking commands),
// so this is a factory rather than a shared instance.
export const createConnection = () => new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })

const queueConnection = createConnection()
export const reminderSchedulingQueue = new Queue('reminder-scheduling', { connection: queueConnection })
export const outboundMessagesQueue = new Queue('outbound-messages', { connection: queueConnection })

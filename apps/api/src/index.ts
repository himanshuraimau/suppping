import { Hono } from 'hono'
import type { HealthResponse } from '@suppping/shared-types'
import { env } from './env.js'
import { logger } from './logger.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.json<HealthResponse>({ status: 'ok' })
})

logger.info(`api starting on port ${env.PORT}`)

export default {
  port: env.PORT,
  fetch: app.fetch,
}

import { Hono } from 'hono'
import type { HealthResponse } from '@suppping/shared-types'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.json<HealthResponse>({ status: 'ok' })
})

export default {
  port: 3000,
  fetch: app.fetch,
}

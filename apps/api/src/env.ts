import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3000),
})

export const env = schema.parse(process.env)

import { pgTable, uuid, text, timestamp, jsonb, time } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull().unique(),
  name: text('name'),
  timezone: text('timezone').notNull().default('Asia/Kolkata'),
  quietHoursStart: time('quiet_hours_start'),
  quietHoursEnd: time('quiet_hours_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  pendingClarification: jsonb('pending_clarification'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  whatsappMessageId: text('whatsapp_message_id').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  recurrenceRule: text('recurrence_rule'),
  timezone: text('timezone').notNull(),
  status: text('status', { enum: ['scheduled', 'delivered', 'cancelled'] })
    .notNull()
    .default('scheduled'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  status: text('status', { enum: ['pending', 'done'] })
    .notNull()
    .default('pending'),
  dueAt: timestamp('due_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull().default('google'),
  externalEventId: text('external_event_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const reminderRecipients = pgTable('reminder_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  reminderId: uuid('reminder_id').notNull().references(() => reminders.id),
  recipientUserId: uuid('recipient_user_id').notNull().references(() => users.id),
  status: text('status', { enum: ['pending', 'accepted', 'declined'] })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const aiAuditLog = pgTable('ai_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  messageId: uuid('message_id').references(() => messages.id),
  toolCalled: text('tool_called').notNull(),
  toolInput: jsonb('tool_input').notNull(),
  toolResult: jsonb('tool_result'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

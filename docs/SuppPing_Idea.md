# SuppPing — Product Idea & Technical Blueprint

## 1. Product Overview

**SuppPing** is a personal AI assistant that lives inside WhatsApp.

The core idea is simple:

> **Just message it. SuppPing remembers and acts.**

Instead of opening a separate reminder, task, calendar, or productivity application, users interact with SuppPing through natural language on WhatsApp.

Examples:

- "Remind me to call Mom tomorrow at 6."
- "Every Monday at 9, remind me to submit the report."
- "Schedule a meeting with Rahul tomorrow at 4."
- "What do I have planned for tomorrow?"
- "Remind me to buy milk when I get home."

SuppPing interprets the message, determines the user's intent, extracts the required information, stores it, schedules any necessary action, and communicates the result back through WhatsApp.

---

## 2. Core Product Philosophy

SuppPing should feel less like a traditional productivity application and more like **messaging a personal assistant**.

Users should not need to learn commands or navigate complicated interfaces.

Instead of:

> Create reminder → select date → select time → save

the experience should be:

> "Remind me about the assignment tomorrow at 8 PM."

The AI handles the structure behind the scenes.

---

## 3. Initial Product Scope

The MVP should focus on a small number of highly reliable capabilities.

### Reminders

- One-time reminders
- Recurring reminders
- Natural-language dates and times
- Timezone awareness
- Reminder confirmation
- Reminder delivery through WhatsApp
- Edit reminders
- Delete/cancel reminders
- List upcoming reminders

### Tasks

- Create tasks
- Mark tasks complete
- Delete tasks
- List pending tasks
- Natural-language task creation

### Calendar

Integration with Google Calendar or equivalent calendar provider.

Capabilities:

- Create events
- Read upcoming events
- Cancel events
- Modify events
- Detect scheduling conflicts

### AI Interaction

Users should be able to use natural language rather than structured commands.

The AI should extract structured intent from messages.

Example:

```text
User:
Remind me every weekday at 9:30 to check the production dashboard.

AI:
Intent: CREATE_REMINDER
Task: Check the production dashboard
Schedule: Weekdays
Time: 09:30
Timezone: User timezone
```

---

# 4. Future Product Direction

SuppPing should not be permanently positioned as a "reminder bot."

Reminders are the initial product wedge.

The long-term product is:

> **An AI personal assistant accessible through WhatsApp.**

Potential future capabilities:

- Tasks
- Calendar management
- Notes
- Personal information retrieval
- Daily summaries
- Meeting reminders
- Follow-ups
- Habit tracking
- Location-based reminders
- Email-related workflows
- Automated recurring workflows
- Document/information retrieval
- Notifications
- Personal preferences
- Multi-step AI actions

The goal is to allow users to delegate small personal workflows through a conversational interface.

---

# 5. Example User Experience

## Create a reminder

```text
User:
Remind me to submit the assignment tomorrow at 7 PM.

SuppPing:
Got it. I'll remind you tomorrow at 7:00 PM.
```

## Recurring reminder

```text
User:
Remind me every Monday at 10 AM to submit the weekly report.

SuppPing:
Done. I'll remind you every Monday at 10:00 AM.
```

## Query reminders

```text
User:
What reminders do I have tomorrow?

SuppPing:
Tomorrow:
• 9:00 AM — Team standup
• 2:00 PM — Call Rahul
• 7:00 PM — Submit assignment
```

## Modify reminder

```text
User:
Move the assignment reminder to 8 PM.

SuppPing:
Done. The assignment reminder is now scheduled for 8:00 PM.
```

## Calendar

```text
User:
Schedule a meeting with Rahul tomorrow at 4 PM for 30 minutes.

SuppPing:
I found no conflict. Meeting scheduled for tomorrow at 4:00 PM.
```

---

# 6. High-Level Architecture

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   WhatsApp    │
                         └───────┬───────┘
                                 │
                              Webhook
                                 │
                                 ▼
                   ┌─────────────────────────┐
                   │     SuppPing API        │
                   │  Node.js + TypeScript   │
                   └────────────┬────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
        ┌───────────┐     ┌────────────┐    ┌────────────┐
        │ AI Layer  │     │ PostgreSQL │    │   Redis    │
        │ LLM/API   │     │            │    │   Queue    │
        └─────┬─────┘     └────────────┘    └─────┬──────┘
              │                                    │
              │                                    ▼
              │                              ┌───────────┐
              │                              │  Workers  │
              │                              └─────┬─────┘
              │                                    │
              └────────────────┬───────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
                WhatsApp    Calendar   Payments
                   API         API       API
```

---

# 7. Recommended Tech Stack

## Marketing Website

### Astro

Use Astro for the public website because the site is primarily:

- Content-heavy
- SEO-focused
- Performance-sensitive
- Mostly static
- Marketing-oriented

Astro can still use React components where interactive UI is required.

### Frontend

- Astro
- React
- TypeScript
- Tailwind CSS

Potential website sections:

```text
/
├── Home
├── Features
│   ├── Reminders
│   ├── Tasks
│   ├── Calendar
│   └── AI Assistant
├── Pricing
├── About
├── FAQ
├── Blog
└── Guides
```

---

# 8. Backend

The backend should be independent of the frontend framework.

### Recommended stack

- Node.js
- TypeScript
- Fastify or Hono
- Zod
- PostgreSQL
- Drizzle ORM
- Redis
- BullMQ

The backend handles:

- Authentication
- User management
- WhatsApp webhooks
- Message processing
- AI orchestration
- Reminder creation
- Reminder scheduling
- Task management
- Calendar integrations
- Payments
- Subscription management
- Rate limiting
- Background jobs

---

# 9. Database

### PostgreSQL

PostgreSQL should be the primary persistent datastore.

Potential entities:

```text
users
 ├── id
 ├── phone_number
 ├── name
 ├── timezone
 ├── created_at
 └── updated_at

conversations
 ├── id
 ├── user_id
 ├── created_at
 └── updated_at

messages
 ├── id
 ├── conversation_id
 ├── role
 ├── content
 ├── whatsapp_message_id
 └── created_at

reminders
 ├── id
 ├── user_id
 ├── title
 ├── scheduled_at
 ├── recurrence_rule
 ├── timezone
 ├── status
 └── created_at

tasks
 ├── id
 ├── user_id
 ├── title
 ├── status
 ├── due_at
 └── created_at

calendar_events
 ├── id
 ├── user_id
 ├── provider
 ├── external_event_id
 └── created_at

subscriptions
 ├── id
 ├── user_id
 ├── plan
 ├── status
 └── expires_at
```

The exact schema should evolve as the product is implemented.

---

# 10. Redis and Background Jobs

Redis should handle short-lived and asynchronous workloads.

BullMQ can provide the job queue.

Examples:

```text
Reminder scheduled
        ↓
Redis / BullMQ
        ↓
Worker
        ↓
WhatsApp API
        ↓
User receives reminder
```

Background workers should handle:

- Scheduled reminders
- Recurring reminders
- Calendar synchronization
- Retryable API calls
- Notifications
- Delayed actions
- Periodic maintenance jobs

The API server should not remain responsible for long-running or scheduled work.

---

# 11. AI Layer

The AI layer translates natural-language messages into structured actions.

Example:

```text
User message
     ↓
Intent detection
     ↓
Entity extraction
     ↓
Validation
     ↓
Action selection
     ↓
Tool/API execution
     ↓
Database update
     ↓
Response generation
```

Example:

```json
{
  "intent": "create_reminder",
  "title": "Call Mom",
  "datetime": "2026-09-10T18:00:00",
  "timezone": "Asia/Kolkata",
  "recurrence": null
}
```

The AI should not directly manipulate the database.

Instead:

```text
LLM
 ↓
Structured tool call
 ↓
Backend validation
 ↓
Application service
 ↓
Database
```

This keeps business logic deterministic and auditable.

---

# 12. AI Safety and Reliability

The AI layer should be treated as an interpreter, not as the source of truth.

Important rules:

- Validate extracted dates
- Validate timezone
- Validate recurrence rules
- Validate required fields
- Never silently invent missing critical information
- Confirm destructive actions
- Use deterministic backend services for execution
- Store structured actions
- Maintain an audit trail
- Make operations idempotent where possible

Example:

```text
LLM says:
Create reminder at 9 PM.

Backend:
Validate datetime
Validate timezone
Create reminder
Schedule job
Return confirmation
```

---

# 13. WhatsApp Integration

WhatsApp is the primary user interface.

The system needs:

```text
WhatsApp
   ↓
Webhook
   ↓
Backend
   ↓
Message processing
   ↓
AI
   ↓
Action
   ↓
WhatsApp response
```

The backend should be designed around webhook-driven communication.

Important concerns:

- Webhook verification
- Message IDs
- Duplicate message handling
- Delivery status
- Retry handling
- Rate limits
- Template-message requirements where applicable
- User opt-in/opt-out
- WhatsApp conversation/session rules

---

# 14. Payments

For an India-focused product:

**Razorpay** can be used initially.

Potential subscription structure:

```text
Free
├── Limited reminders
└── Basic functionality

Pro
├── More reminders
├── Recurring reminders
├── Calendar integration
├── Advanced AI capabilities
└── Higher usage limits
```

Pricing should be determined after validating usage and infrastructure costs.

---

# 15. Project Structure

Recommended monorepo:

```text
suppping/
│
├── apps/
│   ├── web/
│   │   ├── Astro
│   │   ├── React
│   │   └── Tailwind
│   │
│   ├── api/
│   │   ├── Node.js
│   │   └── TypeScript
│   │
│   └── worker/
│       └── Background jobs
│
├── packages/
│   ├── db/
│   ├── types/
│   ├── validation/
│   ├── config/
│   └── shared/
│
├── infrastructure/
│   ├── docker/
│   └── deployment/
│
├── docs/
│
└── README.md
```

---

# 16. Development Phases

## Phase 1 — Foundation

- Repository setup
- TypeScript configuration
- PostgreSQL
- Database schema
- API server
- Redis
- Worker
- Environment configuration
- Logging
- Error handling

## Phase 2 — WhatsApp MVP

- WhatsApp webhook
- Incoming message processing
- Outgoing message support
- User identification
- Basic conversation handling

## Phase 3 — Reminders

- Natural-language reminder creation
- Reminder persistence
- Scheduling
- Background workers
- Reminder delivery
- Recurring reminders
- Edit/delete reminders

## Phase 4 — AI

- Intent classification
- Structured extraction
- Tool calling
- Validation
- Context handling
- Conversation memory

## Phase 5 — Tasks

- Create tasks
- Complete tasks
- Delete tasks
- Due dates
- Task queries

## Phase 6 — Calendar

- Google OAuth
- Calendar access
- Event creation
- Event lookup
- Event modification
- Conflict detection

## Phase 7 — Payments

- Razorpay integration
- Plans
- Subscription state
- Usage limits
- Webhooks

## Phase 8 — Website

- Astro marketing site
- SEO
- Pricing
- Documentation
- Blog
- Landing pages
- Authentication/onboarding

---

# 17. Non-Functional Requirements

The system should prioritize:

### Reliability

A reminder that fails to arrive is a core product failure.

### Idempotency

WhatsApp retries or duplicate webhooks should not create duplicate reminders.

### Observability

Track:

- Incoming messages
- AI decisions
- Tool calls
- Database operations
- Job execution
- Failed jobs
- WhatsApp delivery status
- API latency

### Security

- Encrypt sensitive credentials
- Secure OAuth tokens
- Validate webhooks
- Apply authentication and authorization
- Protect APIs
- Rate-limit users
- Never expose internal database operations through the LLM

---

# 18. Website Strategy

The website should be treated as a **marketing and acquisition surface**, not the primary application.

Primary goals:

1. Explain the product quickly
2. Demonstrate how it works
3. Build trust
4. Rank for relevant search queries
5. Convert visitors into WhatsApp users
6. Explain pricing
7. Provide documentation and guides

Astro is therefore the preferred frontend framework.

Next.js is unnecessary unless a substantial authenticated web application/dashboard is introduced later.

---

# 19. Brand

### Name

**SuppPing**

The name combines the informal "sup" association with messaging and "ping" as a notification/reminder concept.

### Positioning

**SuppPing — Your personal assistant on WhatsApp.**

Alternative tagline:

> **Just message it. SuppPing remembers.**

The brand should remain broad enough that the product can evolve beyond reminders.

---

# 20. Core Product Loop

The entire product can be reduced to this loop:

```text
MESSAGE
   ↓
UNDERSTAND
   ↓
VALIDATE
   ↓
ACT
   ↓
REMEMBER
   ↓
NOTIFY
```

Example:

```text
"Remind me every Friday at 5 to submit my report."

        ↓

Understand:
Recurring reminder

        ↓

Validate:
Friday
17:00
User timezone

        ↓

Store:
Reminder in PostgreSQL

        ↓

Schedule:
BullMQ / Redis

        ↓

Execute:
WhatsApp API

        ↓

Notify:
"Reminder: Submit your report."
```

---

# 21. Product Definition

### One-line description

**SuppPing is an AI personal assistant that lets users manage reminders, tasks, calendars, and personal workflows through natural-language messages on WhatsApp.**

### MVP

**WhatsApp + AI + Reminders + PostgreSQL + Redis + Node.js**

### Website

**Astro + React + Tailwind + SEO-focused content**

### Backend

**Node.js + TypeScript + Fastify/Hono + PostgreSQL + Redis/BullMQ**

### Long-term vision

**A general-purpose AI personal assistant that users can interact with entirely through messaging.**

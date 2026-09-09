# SuppPing Backend — Architecture & Feature Spec

This doc is the concrete backend plan. [SuppPing_Idea.md](SuppPing_Idea.md) is the product blueprint and stays as-is for vision/phasing; this doc exists because that blueprint leaves several backend decisions open ("LLM/API", "WhatsApp API", "Fastify or Hono", a `packages/{db,validation,config,shared}` split) that block writing actual code. Every open question below has been resolved to one concrete choice. Where the idea doc's recommended project structure conflicts with YAGNI, this doc wins.

We are explicitly building our MVP feature set to match **[Poko](https://www.pokobot.com)** ("Poko | WhatsApp Reminder Bot – Text it, get poked on time") — a WhatsApp reminder bot by Radical Labs. Their shipped feature set (researched 2026-09) is the bar for our MVP+v1.1, folded into the feature list below.

## 1. Decisions that close the idea doc's gaps

| Open question in the idea doc | Decision |
|---|---|
| "LLM/API" (unspecified) | Anthropic Claude via tool calling. Haiku for intent classification/entity extraction (cheap, fast, high volume); Sonnet as fallback when Haiku's confidence is low or the request is multi-step/ambiguous. |
| WhatsApp integration (generic) | **Meta WhatsApp Cloud API** direct (not a BSP like Twilio/Gupshup) — no per-message markup, official, sufficient for MVP volume. |
| "Fastify or Hono" | Hono — already the choice made in `apps/api`. No reason to reopen it. |
| `packages/db`, `packages/validation`, `packages/config`, `packages/shared` (idea doc §15) | **Skip this split for now.** One extra package per concern is premature for a two-app MVP. Keep `packages/shared-types` (rename in spirit to "shared" if it starts holding Zod schemas too) and put DB/config code directly in the apps that own it. Split out a package only when `apps/worker` and `apps/api` actually duplicate real logic — not preemptively. |
| Idempotency (listed as a requirement, no mechanism) | Unique constraint on `messages.whatsapp_message_id` dedupes inbound webhook retries. Every reminder-delivery job is keyed `reminder:{id}:{scheduled_at}` in BullMQ so a re-scheduled job can't double-fire. |
| Recurring reminders (no representation given) | Store `recurrence_rule` as an **RRULE string** (`rrule` npm package). Worker computes the next occurrence and schedules exactly one delayed job for it; on delivery, it computes and schedules the following occurrence. (Not BullMQ's built-in repeatable jobs — those make edit/cancel/snooze of a single occurrence awkward.) |
| Conversation memory / multi-turn context (no design) | Last ~20 messages per conversation, pulled from the `messages` table, form the LLM prompt window. A `conversations.pending_clarification` field holds structured state when the AI needs to ask a follow-up ("which reminder?") before it can call a tool. |
| Tool contract between AI and backend ("structured tool call", not enumerated) | Fixed tool list, one Zod schema each — see §3. The LLM never touches the DB directly; it only ever emits one of these tool calls, which the backend validates and executes. |
| Timezone capture (no design) | Default `Asia/Kolkata` (India-first launch) on signup; ask once in the onboarding message ("what city are you in?") and store on `users.timezone`. Changeable later via chat ("I'm in London now"). |
| Auth model (none specified) | No passwords, no JWT. Identity = the phone number Meta's webhook already verified. Backend upserts a `users` row by `phone_number` on first inbound message. A web dashboard, if it ever exists, would need its own login — out of scope for MVP. |
| Delivery vs. scheduling coupling (implicit) | Two separate BullMQ queues in `apps/worker`: `reminder-scheduling` (fires at the due time) and `outbound-messages` (actually calls the WhatsApp Send API, with its own retry/backoff). A WhatsApp API outage stalls sends, not scheduling. |
| Observability tools (requirement listed, none named) | `pino` for structured stdout logs (Bun-friendly), Sentry for exceptions. AI decisions and tool calls get written to an `ai_audit_log` table (not a separate events pipeline) — good enough for MVP-scale debugging. |
| Migrations tooling (unspecified) | `drizzle-kit` (pairs with Drizzle ORM, already the idea doc's DB choice). |

## 2. Full feature list

Legend: **MVP** = phase 1 backend work, **v1.1** = right after MVP proves out, **Later** = long-term vision, not scheped yet.

### Reminders (MVP, matches Poko)
- One-time reminders from natural language ("remind me to call Mom tomorrow at 6")
- Recurring reminders (daily/weekly/monthly/custom via RRULE)
- Timezone-aware scheduling
- List upcoming reminders
- Edit a reminder (time, title)
- Snooze a reminder
- Cancel/delete a reminder
- Delivery confirmation message back on WhatsApp

### Reminders — v1.1 (Poko parity)
- **Quiet hours**: user sets a window (e.g. 11pm–7am) where non-urgent reminders queue until the window ends instead of firing.
- **Cross-person reminders with consent**: user A asks to nudge user B; B gets one opt-in message and must accept before any reminder is delivered to them.

### Tasks (MVP)
- Create, complete, delete tasks via natural language
- List pending tasks
- Due dates on tasks

### Calendar (v1.1, matches Poko)
- Google OAuth connect
- Create events from chat, including scheduling a meeting with a Google Meet link and inviting attendees
- Read upcoming events
- Modify/cancel events
- Conflict detection before creating an event

### AI interaction (MVP)
- Natural-language intent detection + entity extraction (no slash commands)
- Multi-turn clarification when required fields are missing or ambiguous ("remind me about the thing" → AI asks what/when)
- Tool-calling only — AI never writes to the DB directly (see §3)

### Payments (Later, after MVP validates retention)
- Razorpay subscriptions, Free vs Pro tiers, usage limits — deferred; not worth building before the reminder core is reliable.

### Explicitly out of scope for now
Notes, daily summaries, habit tracking, location-based reminders, email workflows — all "Later" per the idea doc's §4. Don't build scaffolding for these yet.

## 3. AI tool contract

The LLM is only ever allowed to emit one of these calls (each backed by a Zod schema the backend validates before touching Postgres):

```
create_reminder(title, datetime, timezone, recurrence_rule?)
edit_reminder(reminder_id, title?, datetime?, recurrence_rule?)
snooze_reminder(reminder_id, minutes)
cancel_reminder(reminder_id)
list_reminders(range?)              // "today" | "tomorrow" | "week" | all upcoming
create_task(title, due_at?)
complete_task(task_id)
delete_task(task_id)
list_tasks()
create_calendar_event(title, start, end, attendees?)
list_calendar_events(range)
cancel_calendar_event(event_id)
```

Flow for every message: `Understand → Validate → Act → Remember → Notify` (unchanged from the idea doc's §20 — that loop was already correct, it just needed the tool list above to be concrete).

## 4. Data model additions (on top of idea doc §9)

- `users.timezone` — defaults `Asia/Kolkata`, set on first onboarding message.
- `users.quiet_hours_start`, `users.quiet_hours_end` — nullable, v1.1.
- `messages.whatsapp_message_id` — **unique**, the idempotency key for inbound webhook retries.
- `conversations.pending_clarification` — nullable JSON, holds partial tool-call state while the AI is mid-clarification.
- `reminder_recipients` (v1.1) — `reminder_id, recipient_user_id, status (pending|accepted|declined)` for cross-person reminders.
- `ai_audit_log` — `id, user_id, message_id, tool_called, tool_input, tool_result, created_at` — every tool call, for debugging and abuse review.

## 5. Queues (`apps/worker`, doesn't exist in code yet)

- `reminder-scheduling` — one delayed job per upcoming occurrence, keyed `reminder:{id}:{scheduled_at}`. On fire: check quiet hours, enqueue `outbound-messages`, and if recurring, schedule the next occurrence.
- `outbound-messages` — actual WhatsApp Send API calls, retried with exponential backoff on failure, independent of scheduling.

## 6. Phased delivery (backend only; website/payments phases from the idea doc are unaffected)

1. **Foundation** — Postgres + Drizzle + drizzle-kit, `apps/worker` scaffold, env validation (Zod at boot, no `packages/config`), pino logging.
2. **WhatsApp MVP** — Meta Cloud API webhook in `apps/api`, inbound dedup, `users`/`conversations`/`messages` tables, echo-back "got it" replies (no AI yet).
3. **Reminders** — the tool contract for reminders, `reminder-scheduling`/`outbound-messages` queues, RRULE-based recurrence.
4. **AI orchestration** — Claude tool-calling wired to the reminder tools, multi-turn clarification, `ai_audit_log`.
5. **Tasks** — same pattern as reminders, no scheduling needed.
6. **Calendar** — Google OAuth, event tools, conflict detection.
7. **Quiet hours + cross-person reminders** — v1.1 Poko-parity features.
8. **Payments** — Razorpay, deferred until the above is reliable in production.

## 7. Working convention while implementing this

Use the **ponytail** skill for every piece of backend code written against this plan — the simplest thing that actually works, standard library and the chosen deps (Hono, Drizzle, BullMQ, Zod, rrule) over new dependencies, no speculative abstractions for "Later" features. If a step above tempts you toward a package split, an abstraction layer, or a config system before something real needs it, that's the signal to not build it yet.

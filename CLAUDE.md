# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SuppPing is an early-stage Bun monorepo. The product concept (an AI assistant reachable over WhatsApp for reminders/tasks/calendar) is documented in [docs/SuppPing_Idea.md](docs/SuppPing_Idea.md) as a blueprint. Foundation (Phase 1 of [docs/Backend_Architecture.md](docs/Backend_Architecture.md)) is in place; WhatsApp webhook, AI orchestration, and actual reminder/task/calendar logic are **not yet implemented**. Current code:

- `apps/web` — Astro site (default starter page, no routes/content built yet)
- `apps/api` — Hono API on Bun: `/` and `/health` routes, Postgres via Drizzle (`src/db/schema.ts` has all 8 tables from the backend doc's data model, migrations in `apps/api/drizzle/`), Zod-validated env (`src/env.ts`), pino logging.
- `apps/worker` — BullMQ job processor on Bun: `reminder-scheduling` and `outbound-messages` queues (`src/queues.ts`) with stub log-only processors (`src/index.ts`) — Phase 3 fills these in with real logic.
- `packages/shared-types` — TypeScript types shared between `web` and `api` (currently just `HealthResponse`)

Don't assume pieces from the blueprint doc that aren't listed above (WhatsApp webhook, AI tool-calling, actual reminder delivery logic) exist in code — check `apps/*/src` first.

Local infra: `docker-compose.yml` runs Postgres only (a Redis on `localhost:6379` is assumed to already be available — see the compose file's comment). Each app has its own `.env` (Bun scopes `.env` loading to the process's cwd, so a root `.env` is *not* picked up by `bun run --cwd apps/x`) — copy `apps/api/.env.example` and `apps/worker/.env.example`.

For the backend specifically, [docs/Backend_Architecture.md](docs/Backend_Architecture.md) is the concrete spec to build against — it resolves the open questions the blueprint left vague (LLM choice, WhatsApp provider, queue design, data model, tool contract) and lists the full feature set (MVP + Poko-parity v1.1 + later). Read it before making backend architectural decisions; don't re-derive choices it already made.

## Commands

Install (run once from repo root):

```bash
bun install
```

Dev servers (run from repo root, each in its own terminal):

```bash
bun run dev:web      # Astro -> http://localhost:4321
bun run dev:api      # Hono on Bun, --watch -> http://localhost:3000
bun run dev:worker   # BullMQ worker, --watch
```

Build:

```bash
bun run build          # builds api, worker, then web
bun run build:api      # bun build src/index.ts --outdir dist --target bun
bun run build:worker   # same, for apps/worker
bun run build:web      # astro build
```

Typecheck an app:

```bash
cd apps/api && bun run typecheck      # tsc --noEmit
cd apps/worker && bun run typecheck
```

There is no lint or test setup in this repo yet — don't invent commands for them.

Database migrations (from `apps/api`):

```bash
bun run db:generate   # drizzle-kit generate, after editing src/db/schema.ts
bun run db:migrate    # drizzle-kit migrate, applies to DATABASE_URL
```

Add a dependency to one workspace — `--filter` breaks on the `@suppping/worker` name (bun resolves it as a registry lookup), so use `--cwd` there instead:

```bash
bun add <package> --filter web
bun add <package> --filter api
cd apps/worker && bun add <package>
```

Reference `packages/shared-types` from an app's `package.json` as `"@suppping/shared-types": "workspace:*"` (already wired into `apps/api`).

## Architecture notes

- This is a Bun workspaces monorepo (`workspaces: ["apps/*", "packages/*"]` in the root `package.json`); there is no root build tool beyond the `bun run` scripts that shell into each app.
- `apps/api` is Bun-native: it default-exports `{ port, fetch }` from `src/index.ts` for `bun run` to serve directly (not a Node HTTP server), and uses Hono's typed `c.json<T>()` with types imported from `@suppping/shared-types`.
- `packages/shared-types` has no build step — its `exports`/`main`/`types` all point straight at `src/index.ts`, and consumers resolve the TypeScript source directly.
- `apps/web` is a standalone Astro app; per [apps/web/CLAUDE.md](apps/web/CLAUDE.md), start its dev server in background mode (`astro dev --background`, managed with `astro dev stop`/`status`/`logs`) rather than foreground, since it's long-running.
- `apps/api` and `apps/worker` are independent Bun processes coordinated only through Postgres and the two BullMQ queues — no HTTP calls between them. `apps/web` shares nothing with either at runtime, only compile-time types via `packages/shared-types`.
- `apps/worker` is named `@suppping/worker` in its `package.json`, not the bare `worker` the other apps' naming pattern would suggest — a real npm package is literally called `worker`, and bun's dependency resolution loops if the workspace name collides with it. Keep the scoped name.
- Every relative import in `apps/api/src` and `apps/worker/src` needs an explicit `.js` extension (e.g. `from './env.js'`) — both tsconfigs use `module: "NodeNext"`, which requires it even though the files are `.ts`. `bun run` doesn't care, but `tsc --noEmit` does.
- DB schema lives in `apps/api/src/db/schema.ts` (Drizzle) since `apps/api` is the only current owner/writer; `apps/worker` doesn't touch Postgres yet. If a later phase has the worker read/write reminders directly, that's the trigger to extract a shared `packages/db` — not before.

## Backend implementation convention

When writing or modifying backend code (`apps/api`, `apps/worker`, and anything under `packages/` that backs them), **use the `ponytail` skill**. Favor the simplest thing that works over speculative abstractions — this matters especially here because [docs/Backend_Architecture.md](docs/Backend_Architecture.md) deliberately rejects the idea doc's `packages/{db,validation,config,shared}` split until real duplication justifies it; don't reintroduce that split, a config system, or a plugin layer preemptively while implementing the phases in that doc.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SuppPing is an early-stage Bun monorepo. The product concept (an AI assistant reachable over WhatsApp for reminders/tasks/calendar) is documented in [docs/SuppPing_Idea.md](docs/SuppPing_Idea.md) as a blueprint — most of it (worker app, Postgres, Redis/BullMQ, WhatsApp/AI integration, payments) is **not yet implemented**. The current code is just the initial scaffolding:

- `apps/web` — Astro site (default starter page, no routes/content built yet)
- `apps/api` — Hono API on Bun (a single `src/index.ts` with `/` and `/health` routes)
- `packages/shared-types` — TypeScript types shared between `web` and `api` (currently just `HealthResponse`)

Don't assume pieces from the blueprint doc (worker service, DB schema, WhatsApp webhook, AI layer) exist in code — check `apps/*/src` first.

For the backend specifically, [docs/Backend_Architecture.md](docs/Backend_Architecture.md) is the concrete spec to build against — it resolves the open questions the blueprint left vague (LLM choice, WhatsApp provider, queue design, data model, tool contract) and lists the full feature set (MVP + Poko-parity v1.1 + later). Read it before making backend architectural decisions; don't re-derive choices it already made.

## Commands

Install (run once from repo root):

```bash
bun install
```

Dev servers (run from repo root, each in its own terminal):

```bash
bun run dev:web   # Astro -> http://localhost:4321
bun run dev:api   # Hono on Bun, --watch -> http://localhost:3000
```

Build:

```bash
bun run build       # builds api then web
bun run build:api   # bun build src/index.ts --outdir dist --target bun
bun run build:web   # astro build
```

Typecheck the API app:

```bash
cd apps/api && bun run typecheck   # tsc --noEmit
```

There is no lint or test setup in this repo yet — don't invent commands for them.

Add a dependency to one workspace from the repo root:

```bash
bun add <package> --filter web
bun add <package> --filter api
```

Reference `packages/shared-types` from an app's `package.json` as `"@suppping/shared-types": "workspace:*"` (already wired into `apps/api`).

## Architecture notes

- This is a Bun workspaces monorepo (`workspaces: ["apps/*", "packages/*"]` in the root `package.json`); there is no root build tool beyond the `bun run` scripts that shell into each app.
- `apps/api` is Bun-native: it default-exports `{ port, fetch }` from `src/index.ts` for `bun run` to serve directly (not a Node HTTP server), and uses Hono's typed `c.json<T>()` with types imported from `@suppping/shared-types`.
- `packages/shared-types` has no build step — its `exports`/`main`/`types` all point straight at `src/index.ts`, and consumers resolve the TypeScript source directly.
- `apps/web` is a standalone Astro app; per [apps/web/CLAUDE.md](apps/web/CLAUDE.md), start its dev server in background mode (`astro dev --background`, managed with `astro dev stop`/`status`/`logs`) rather than foreground, since it's long-running.
- The two apps are independent deployables (Astro site vs. Hono API) that only share compile-time types via `packages/shared-types` — there is no runtime coupling between them yet.

## Backend implementation convention

When writing or modifying backend code (`apps/api`, `apps/worker` once it exists, and anything under `packages/` that backs them), **use the `ponytail` skill**. Favor the simplest thing that works over speculative abstractions — this matters especially here because [docs/Backend_Architecture.md](docs/Backend_Architecture.md) deliberately rejects the idea doc's `packages/{db,validation,config,shared}` split until real duplication justifies it; don't reintroduce that split, a config system, or a plugin layer preemptively while implementing the phases in that doc.

# suppping

Bun-powered monorepo with a separate Astro frontend and Hono backend.

## Structure

```
apps/
  web/      Astro site
  api/      Hono API server (runs on Bun)
  worker/   BullMQ job processor (runs on Bun)
packages/
  shared-types/   Types shared between web and api
```

Backend architecture and full feature plan: [docs/Backend_Architecture.md](docs/Backend_Architecture.md).

## Getting started

```bash
bun install
docker compose up -d   # local Postgres (needs a Redis on localhost:6379 too — docker-compose.yml has notes)
```

Copy each app's env file and fill it in:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
```

Apply database migrations:

```bash
cd apps/api && bun run db:migrate
```

Run each app in its own terminal:

```bash
bun run dev:web      # Astro dev server -> http://localhost:4321
bun run dev:api      # Hono API server -> http://localhost:3000
bun run dev:worker   # BullMQ worker (reminder-scheduling, outbound-messages queues)
```

## Build

```bash
bun run build
```

## Adding a workspace dependency

From the repo root:

```bash
bun add <package> --filter web
bun add <package> --filter api
```

Reference a shared package from `packages/*` as `"@suppping/<name>": "workspace:*"` in that app's `package.json`.

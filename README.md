# suppping

Bun-powered monorepo with a separate Astro frontend and Hono backend.

## Structure

```
apps/
  web/    Astro site
  api/    Hono API server (runs on Bun)
packages/
  shared-types/   Types shared between web and api
```

## Getting started

```bash
bun install
```

Run each app in its own terminal:

```bash
bun run dev:web   # Astro dev server -> http://localhost:4321
bun run dev:api   # Hono API server -> http://localhost:3000
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

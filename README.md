# Mugenkai

Anime and manga discovery, tracking and discussion. One Next.js app (App Router) with its own API routes and a PostgreSQL database, deployed on Vercel.

The catalog fills itself: scheduled jobs pull the most popular anime (every season, every episode, official streaming links) from AniList and manga chapters from MangaDex. Episodes link out to where they stream officially (Crunchyroll, Netflix, …); manga chapters are read in-app from MangaDex, or linked to the official reader when that's where they're published.

## Stack

Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, zod, Prisma 7 + PostgreSQL.

## Two modes

| | Demo mode (`DATABASE_URL` unset) | Database mode |
|---|---|---|
| Catalog | bundled `src/data/catalog.json` | synced from AniList + MangaDex |
| Sign-in | any email/password, demo user | real accounts (scrypt-hashed passwords, httpOnly session cookie) |
| Progress, list, comments | this browser only | stored per account, synced across devices |

Demo mode needs no setup, so the app runs before a database exists.

## Setup with a database

1. Create a PostgreSQL database (Neon, Supabase, Vercel Postgres, or local). Use the *pooled* connection URL as `DATABASE_URL` on serverless, and the direct one as `DIRECT_URL` (migrations only).
2. `cp .env.example .env.local` and fill it in. Every variable is explained there.
3. Create the tables:
   ```bash
   pnpm install          # also generates the Prisma client
   pnpm db:deploy        # applies prisma/migrations
   ```
4. Fill the catalog once (then the cron jobs keep it fresh):
   ```bash
   pnpm dev
   curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/catalog   # AniList: anime + manga
   curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/manga     # MangaDex chapters
   ```
   Or sign in with an email listed in `ADMIN_EMAILS` and use **Admin → Data sync → Run now**.

## Sync jobs

| Job | Schedule (`vercel.json`) | What it does |
|---|---|---|
| `catalog` | daily 04:00 UTC | Top `SYNC_TOP_ANIME` anime with their whole TV season chain, episodes, real episode titles and thumbnails, official streaming links; top `SYNC_TOP_MANGA` manga. |
| `manga` | daily 04:30 UTC | Maps each manga to MangaDex (exact match on its AniList id) and adds new English chapters. |
| `airing` | hourly | Re-reads franchises with a currently airing season so new episodes appear. |

Each run is recorded in the `SyncState` table (last success, last error), shown on the admin page and at `/api/health`. All writes are idempotent upserts keyed on AniList ids, so re-running a job is harmless. Vercel's Hobby plan may only allow daily crons; the hourly `airing` job needs Pro or an external scheduler calling the same URL.

## API

| Route | |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me` | accounts and sessions |
| `PATCH /api/me` | profile settings |
| `GET/POST /api/progress`, `PUT /api/progress/episode`, `PUT /api/progress/chapter` | watch/read progress (newest write wins) |
| `GET/POST /api/comments?thread=…`, `DELETE /api/comments/:id`, `POST /api/comments/:id/like` | threaded comments |
| `GET /api/list`, `PUT/DELETE /api/list/:seriesId` | the user's list; `PUT` body `{ status }`: `CURRENT` (watching/reading), `PLANNING`, `COMPLETED`, `PAUSED`, `DROPPED` |
| `GET /api/cron/:job` | sync jobs (Bearer `CRON_SECRET`) |
| `GET /api/health` | liveness + last sync results |

Request bodies are validated with the zod schemas in `src/data/schema.ts`; writes require a session and a same-origin request.

## Structure

```
src/
  app/              routes (server components load data, views render it) and api/ route handlers
  server/           server-only: env, db, auth/sessions, catalog reads, progress, sync/ (AniList, MangaDex, jobs)
  views/            page components
  components/       shared UI (components/ui = shadcn)
  lib/              client state: progress, list, comments (browser store + API sync)
  data/             zod schemas (single source of types), pure helpers, demo catalog
prisma/             schema + migrations
scripts/            fetch-catalog.mjs regenerates the demo catalog
tests/              node --test self-checks
```

## Commands

```bash
pnpm dev            # http://localhost:3000
pnpm build          # prisma generate + next build
pnpm typecheck
pnpm test           # parsing, ids, password hashing
pnpm db:migrate     # create a new migration after editing prisma/schema.prisma (dev database)
pnpm db:deploy      # apply migrations (production)
pnpm db:studio      # browse the database
```

## Deploy (Vercel)

Import the repo, framework preset Next.js. Add the variables from `.env.example` in Project → Settings → Environment Variables. Production deploys run `prisma migrate deploy` automatically (the `vercel-build` script; preview deploys skip it), so set `DIRECT_URL` there too. After the first deploy, trigger the `catalog` and `manga` jobs once.

# Mugenkai

Anime streaming and manga reading platform. One Next.js app (App Router), deployed on Vercel.

Current state: full React frontend on mock data, plus hello-world API services. Database, real backend logic and E2E tests come later.

## Stack

Next.js 16, React 19, Tailwind CSS 4, motion, lucide-react.

## Structure

```
src/
  app/                      routes
    page.tsx                home: full-height hero carousel + content rows (/)
    anime, manga, profile, admin, login, register
    anime/[id], manga/[id]
    watch/[animeId]/[episodeId], read/[mangaId]/[chapterId]
    api/{auth,user,anime,manga}/route.ts   GET -> hello world from each service
    api/health/route.ts     GET -> all services
    layout.tsx              navbar, custom cursor, auth provider
  services/                 one module per former microservice (auth, user, anime, manga)
  views/                    page components
  components/               shared UI
  context/AuthContext.tsx   mock auth (any email/password logs in)
  data/mock-data.ts         anime, manga, user mock data
  styles/                   Tailwind + theme
prisma/schema.prisma        planned data model (not wired up yet)
public/
```

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

`pnpm build` for a production build, `pnpm typecheck` for types.

## Deploy

Import the repo in Vercel. Framework preset Next.js, root directory = repo root. No environment variables needed yet.

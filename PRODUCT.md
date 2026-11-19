# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dedicated anime and manga fans ("otaku") who follow many series at once. They come back often to continue an episode or chapter, check what is new this season, and compare ratings, episode and chapter counts, and status (ongoing or completed).

## Product Purpose

Mugenkai is one place to stream anime and read manga, with a personal history of what was watched and read. Success is a returning fan reaching "continue where I left off" or a new title in a few seconds.

## Positioning

Anime streaming and manga reading side by side in one app and one history, instead of two separate services.

## Operating Context

Desktop browser first, also phone. Sessions are browse, then watch or read; the watch page plays episodes and the read page pages through chapters.

## Capabilities and Constraints

- Next.js 16 app (App Router), React 19, Tailwind CSS 4, motion, lucide-react. Deployed on Vercel.
- All catalog and user data is mock (`src/data/mock-data.ts`). Auth is mocked; any email and password logs in.
- Backend is hello-world placeholders under `src/services`; database not created yet.
- Routes: one home at `/`, anime and manga browse, details, watch, read, profile, admin, login, register.

## Brand Commitments

- Name: Mugenkai.
- Keep the current logo mark used in the navbar.
- Everything else visual is open; the user asked for teal/lagoon instead of purple.

## Evidence on Hand

- Portfolio / demo project. No licensed catalog, no real users, no testimonials, no metrics.
- Images are Unsplash URLs in `mock-data.ts`. Do not invent claims of licensing, catalog size or user counts.

## Product Principles

1. Continue first: the fastest path is back into what the fan was already watching or reading.
2. Show the work: artwork is the content, so let it be seen, not buried under overlays.
3. Density for experts: surface status, episode/chapter counts and ratings without extra clicks.
4. Anime and manga are equals in navigation and layout.

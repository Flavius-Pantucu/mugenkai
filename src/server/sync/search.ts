import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { gql } from "./anilist";

// Thin index of every non-adult title upstream, so search never calls out per keystroke.
// Each run: (1) scan id ranges above the highest id we hold (AniList refuses paging past 5000 rows,
// so the seed walks ids 50 at a time; anime and manga share one id space), then (2) refresh
// recently edited titles. ponytail: ~4000 requests to seed at 30-90 req/min, so the first
// ~20-40 hourly runs are seeding; afterwards each run is a handful of requests.

const FIELDS = `id type format episodes chapters averageScore popularity updatedAt seasonYear startDate { year }
  title { english romaji native } synonyms coverImage { large }`;

const IDS_QUERY = `query ($ids: [Int]) {
  Page(perPage: 50) { pageInfo { hasNextPage } media(id_in: $ids, isAdult: false) { ${FIELDS} } }
}`;
const MAX_ID_QUERY = `{ Page(perPage: 1) { media(sort: ID_DESC) { id } } }`;
const UPDATED_QUERY = `query ($type: MediaType, $page: Int) {
  Page(page: $page, perPage: 50) { pageInfo { hasNextPage } media(type: $type, sort: UPDATED_AT_DESC, isAdult: false) { ${FIELDS} } }
}`;

interface Media {
  id: number;
  type: "ANIME" | "MANGA";
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  averageScore: number | null;
  popularity: number | null;
  updatedAt: number;
  seasonYear: number | null;
  startDate: { year: number | null };
  title: { english: string | null; romaji: string | null; native: string | null };
  synonyms: string[] | null;
  coverImage: { large: string | null };
}
type Page = { Page: { pageInfo: { hasNextPage: boolean }; media: Media[] } };

/** Vercel cron cap is 300s; a 429 back-off can sleep up to ~60s, so stop starting requests well before. */
const BUDGET_MS = 200_000;

async function upsert(media: Media[]) {
  if (media.length === 0) return;
  const rows = media.map((m) => {
    const title = m.title.english || m.title.romaji || m.title.native || `#${m.id}`;
    const altTitle = m.title.romaji || m.title.native || title;
    const terms = [...new Set([m.title.english, m.title.romaji, m.title.native, ...(m.synonyms ?? [])].filter(Boolean))]
      .join(" | ")
      .toLowerCase();
    return Prisma.sql`(${m.id}, ${m.type}::"SeriesKind", ${title}, ${altTitle}, ${terms}, ${m.coverImage.large ?? ""},
      ${m.format}, ${m.seasonYear ?? m.startDate.year}, ${m.episodes ?? m.chapters},
      ${m.averageScore ? m.averageScore / 10 : 0}, ${m.popularity ?? 0})`;
  });
  await db().$executeRaw`
    INSERT INTO "SearchEntry" (id, kind, title, "altTitle", terms, cover, format, year, count, rating, popularity)
    VALUES ${Prisma.join(rows)}
    ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, title = EXCLUDED.title, "altTitle" = EXCLUDED."altTitle",
      terms = EXCLUDED.terms, cover = EXCLUDED.cover, format = EXCLUDED.format, year = EXCLUDED.year,
      count = EXCLUDED.count, rating = EXCLUDED.rating, popularity = EXCLUDED.popularity`;
}

export async function syncSearch(since: Date | null) {
  const deadline = Date.now() + BUDGET_MS;
  const stats = { added: 0, refreshed: 0, seeded: true, nextId: 0 };

  const upstreamMax = (await gql<{ Page: { media: { id: number }[] } }>(MAX_ID_QUERY, {})).Page.media[0]?.id ?? 0;
  let from = ((await db().searchEntry.aggregate({ _max: { id: true } }))._max.id ?? 0) + 1;
  for (; from <= upstreamMax; from += 50) {
    if (Date.now() > deadline) return { ...stats, seeded: false, nextId: from };
    const { Page } = await gql<Page>(IDS_QUERY, { ids: Array.from({ length: 50 }, (_, i) => from + i) });
    await upsert(Page.media);
    stats.added += Page.media.length;
  }

  // Edits to existing titles (scores, covers, episode counts). Overlap a day so a missed run loses nothing.
  const cutoff = (since ? since.getTime() - 86_400_000 : Date.now() - 2 * 86_400_000) / 1000;
  for (const type of ["ANIME", "MANGA"] as const) {
    for (let page = 1; page <= 20 && Date.now() < deadline; page++) {
      const { Page } = await gql<Page>(UPDATED_QUERY, { type, page });
      const fresh = Page.media.filter((m) => m.updatedAt >= cutoff);
      await upsert(fresh);
      stats.refreshed += fresh.length;
      if (fresh.length < Page.media.length || !Page.pageInfo.hasNextPage) break;
    }
  }
  return stats;
}

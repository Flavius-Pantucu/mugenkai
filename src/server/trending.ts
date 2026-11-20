import { z } from "zod";
import type { Trending, TrendingEntry, TrendingWindow } from "@/data/schema";
import { seasonToSeries, type Catalog } from "./catalog";

// Real trending from AniList's daily trend scores (MediaTrend), summed over a window.
// Sequel seasons are folded into their franchise when it's in our catalog. Cached for an hour.

const QUERY = `query ($page: Int, $from: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    mediaTrends(date_greater: $from, sort: TRENDING_DESC) {
      mediaId trending episode
      media { type isAdult format title { english romaji } coverImage { large } }
    }
  }
}`;

const ResponseSchema = z.object({
  data: z.object({
    Page: z.object({
      pageInfo: z.object({ hasNextPage: z.boolean() }),
      mediaTrends: z.array(
        z.object({
          mediaId: z.number(),
          trending: z.number(),
          episode: z.number().nullable(),
          media: z.object({
            type: z.string(),
            isAdult: z.boolean().nullable(),
            format: z.string().nullable(),
            title: z.object({ english: z.string().nullable(), romaji: z.string() }),
            coverImage: z.object({ large: z.string() }),
          }),
        }),
      ),
    }),
  }),
});

// Days covered and how many 50-row pages to read (trend rows are per title per day, highest first).
const WINDOWS: Record<TrendingWindow, { days: number; pages: number }> = {
  day: { days: 1, pages: 2 },
  week: { days: 7, pages: 4 },
  month: { days: 30, pages: 8 },
};
const TOP = 10;
const FORMAT: Record<string, string> = { TV: "TV", TV_SHORT: "TV short", ONA: "ONA", MOVIE: "Movie", OVA: "OVA", SPECIAL: "Special" };

async function trendingFor(window: TrendingWindow, catalog: Catalog): Promise<TrendingEntry[]> {
  const { days, pages } = WINDOWS[window];
  const seasons = seasonToSeries(catalog);
  const from = Math.floor(Date.now() / 3_600_000) * 3600 - days * 86_400; // hour-aligned → stable cache key
  const totals = new Map<string, TrendingEntry & { latestEpisode: number | null }>();

  for (let page = 1; page <= pages; page++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { page, from } }),
      next: { revalidate: 3600, tags: ["trending"] },
    });
    if (!res.ok) throw new Error(`AniList trending HTTP ${res.status}`);
    const { data } = ResponseSchema.parse(await res.json());

    for (const t of data.Page.mediaTrends) {
      const m = t.media;
      if (m.type !== "ANIME" || m.isAdult) continue;
      const series = seasons.get(t.mediaId);
      const key = series?.id ?? `anilist:${t.mediaId}`;
      const cur = totals.get(key);
      if (cur) {
        cur.score += t.trending;
        cur.latestEpisode = Math.max(cur.latestEpisode ?? 0, t.episode ?? 0) || null;
        continue;
      }
      totals.set(key, {
        key,
        title: series?.title ?? (m.title.english || m.title.romaji),
        cover: series?.coverImage ?? m.coverImage.large,
        score: t.trending,
        seriesId: series?.id ?? null,
        href: series ? `/anime/${series.id}` : `https://anilist.co/anime/${t.mediaId}`,
        meta: series ? series.genres.slice(0, 2).join(" / ") : (FORMAT[m.format ?? ""] ?? "Anime"),
        latestEpisode: t.episode,
      });
    }
    if (!data.Page.pageInfo.hasNextPage) break;
  }

  return [...totals.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP)
    .map(({ latestEpisode, ...e }) => ({ ...e, meta: latestEpisode && !e.seriesId ? `${e.meta} · Episode ${latestEpisode}` : e.meta }));
}

/** Top 10 anime for today, this week and this month. Empty lists (never a crash) if AniList is down. */
export async function getTrending(catalog: Catalog): Promise<Trending> {
  const entries = await Promise.all(
    (Object.keys(WINDOWS) as TrendingWindow[]).map((w) =>
      trendingFor(w, catalog).catch((err) => {
        console.error(`trending (${w}) unavailable:`, err);
        return [];
      }),
    ),
  );
  return { day: entries[0], week: entries[1], month: entries[2] };
}

import { z } from "zod";
import type { ScheduleEntry } from "@/data/schema";
import { seasonToSeries, type Catalog } from "./catalog";

// This week's airing schedule, straight from AniList (no database needed). Cached for an hour by
// Next's fetch cache, so a busy home page costs a handful of AniList requests per hour.

const QUERY = `query ($page: Int, $from: Int, $to: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
      id airingAt episode
      media { id isAdult format popularity episodes title { english romaji } coverImage { large } }
    }
  }
}`;

// Validated at the boundary: a changed AniList response degrades to "no schedule", never a crash.
const ResponseSchema = z.object({
  data: z.object({
    Page: z.object({
      pageInfo: z.object({ hasNextPage: z.boolean() }),
      airingSchedules: z.array(
        z.object({
          id: z.number(),
          airingAt: z.number(),
          episode: z.number(),
          media: z.object({
            id: z.number(),
            isAdult: z.boolean().nullable(),
            format: z.string().nullable(),
            popularity: z.number().nullable(),
            episodes: z.number().nullable(),
            title: z.object({ english: z.string().nullable(), romaji: z.string() }),
            coverImage: z.object({ large: z.string() }),
          }),
        }),
      ),
    }),
  }),
});

const FORMATS = new Set(["TV", "TV_SHORT", "ONA"]);
/** Below this AniList popularity, shows outside our catalog are left out (keeps the list readable). */
const MIN_POPULARITY = 5000;
const DAY = 86_400;

/**
 * Releases from 8 days back to 8 days ahead (the browser picks its local Monday–Sunday out of that,
 * whatever its time zone). Titles in the catalog are always kept and linked to their series page.
 */
export async function getWeekSchedule(catalog: Catalog): Promise<ScheduleEntry[]> {
  const seasons = seasonToSeries(catalog);
  const hour = Math.floor(Date.now() / 3_600_000) * 3600; // stable for an hour → stable cache key
  const from = hour - 8 * DAY;
  const to = hour + 8 * DAY;

  const out: ScheduleEntry[] = [];
  try {
    for (let page = 1; page <= 10; page++) {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: QUERY, variables: { page, from, to } }),
        next: { revalidate: 3600, tags: ["schedule"] },
      });
      if (!res.ok) throw new Error(`AniList schedule HTTP ${res.status}`);
      const { data } = ResponseSchema.parse(await res.json());
      for (const s of data.Page.airingSchedules) {
        const m = s.media;
        const seriesId = seasons.get(m.id)?.id ?? null;
        if (m.isAdult || (!seriesId && (!FORMATS.has(m.format ?? "") || (m.popularity ?? 0) < MIN_POPULARITY))) continue;
        out.push({
          id: s.id,
          airingAt: s.airingAt,
          episode: s.episode,
          mediaId: m.id,
          title: m.title.english || m.title.romaji,
          cover: m.coverImage.large,
          totalEpisodes: m.episodes,
          popularity: m.popularity ?? 0,
          seriesId,
        });
      }
      if (!data.Page.pageInfo.hasNextPage) break;
    }
  } catch (err) {
    console.error("weekly schedule unavailable:", err);
  }
  return out;
}

import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { animeList, getPages, mangaList } from "@/data/mock-data";
import type { Anime, AnimeSummary, Chapter, Manga, MangaPage, MangaSummary } from "@/data/schema";
import { db } from "./db";
import { backendEnabled } from "./env";
import { chapterPages, fetchLiveMangaChapters } from "./sync/mangadex";
import { airedEpisodes, cleanDescription, toStatus } from "./sync/parse";

// Read side of the catalog. Database when DATABASE_URL is set (cached under the "catalog" tag,
// which every sync job revalidates), otherwise the bundled demo catalog.

export interface Catalog {
  anime: AnimeSummary[];
  manga: MangaSummary[];
}

const CACHE = { tags: ["catalog"], revalidate: 3600 };

// ─── Demo mode ───────────────────────────────────────────────────────────────

function demoCatalog(): Catalog {
  return {
    anime: animeList.map(({ episodes: _e, links: _l, ...summary }) => summary),
    manga: mangaList.map(({ chapters, ...summary }) => ({ ...summary, firstChapterId: chapters[0]?.id ?? null })),
  };
}

// ─── Database mode ───────────────────────────────────────────────────────────

const base = (s: {
  id: string;
  title: string;
  nativeTitle: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  color: string | null;
  status: "ONGOING" | "COMPLETED";
  rating: number;
  popularity: number;
  year: number;
  genres: string[];
}) => ({
  id: s.id,
  title: s.title,
  nativeTitle: s.nativeTitle,
  description: s.description,
  coverImage: s.coverImage,
  bannerImage: s.bannerImage,
  color: s.color,
  status: s.status,
  rating: s.rating,
  popularity: s.popularity,
  year: s.year,
  genres: s.genres,
});

const dbCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const rows = await db().series.findMany({
      orderBy: { popularity: "desc" },
      include: {
        seasons: { orderBy: { number: "asc" } },
        chapters: { select: { id: true }, orderBy: { number: "asc" }, take: 1 },
        _count: { select: { chapters: true } },
      },
    });
    const catalog: Catalog = { anime: [], manga: [] };
    for (const r of rows) {
      if (r.kind === "ANIME") {
        if (r.seasons.length === 0) continue;
        catalog.anime.push({
          ...base(r),
          studio: r.studio ?? "Unknown",
          episodeCount: r.seasons.reduce((n, s) => n + s.episodeCount, 0),
          episodeDuration: r.episodeDuration ?? 24,
          trailerYoutubeId: r.trailerYoutubeId,
          seasons: r.seasons.map((s) => ({
            id: s.id,
            number: s.number,
            title: s.title,
            year: s.year,
            episodeCount: s.episodeCount,
            coverImage: s.coverImage,
            bannerImage: s.bannerImage,
          })),
        });
      } else {
        catalog.manga.push({
          ...base(r),
          author: r.author ?? "Unknown",
          // AniList's total when known: MangaDex often lacks licensed chapters in English.
          chapterCount: Math.max(r.chapterTotal ?? 0, r._count.chapters),
          volumeCount: r.volumeCount,
          firstChapterId: r.chapters[0]?.id ?? null,
        });
      }
    }
    return catalog;
  },
  ["catalog-summaries"],
  CACHE,
);

const dbAnime = unstable_cache(
  async (id: string): Promise<Anime | null> => {
    const r = await db().series.findUnique({
      where: { id, kind: "ANIME" },
      include: {
        seasons: { orderBy: { number: "asc" } },
        episodes: { orderBy: [{ seasonNumber: "asc" }, { number: "asc" }], include: { links: true } },
        links: true,
      },
    });
    if (!r || r.seasons.length === 0) return null;
    const summary = (await dbCatalog()).anime.find((a) => a.id === id);
    if (!summary) return null;
    return {
      ...summary,
      links: r.links.map((l) => ({ provider: l.provider, url: l.url })),
      episodes: r.episodes.map((e) => ({
        id: e.id,
        animeId: e.seriesId,
        seasonNumber: e.seasonNumber,
        episodeNumber: e.number,
        title: e.title,
        videoUrl: "",
        duration: e.duration,
        thumbnail: e.thumbnail,
        links: e.links.map((l) => ({ provider: l.provider, url: l.url })),
      })),
    };
  },
  ["anime"],
  CACHE,
);

const dbManga = unstable_cache(
  async (id: string): Promise<Manga | null> => {
    const r = await db().series.findUnique({ where: { id, kind: "MANGA" }, include: { chapters: { orderBy: { number: "asc" } }, links: true } });
    if (!r) return null;
    const summary = (await dbCatalog()).manga.find((m) => m.id === id);
    if (!summary) return null;
    const { firstChapterId: _first, ...rest } = summary;
    return {
      ...rest,
      links: r.links.map((l) => ({ provider: l.provider, url: l.url })),
      chapters: r.chapters.map((c) => ({
        id: c.id,
        mangaId: c.seriesId,
        chapterNumber: c.number,
        title: c.title,
        pageCount: c.pageCount,
        externalUrl: c.externalUrl,
        mangadexChapterId: c.mangadexChapterId,
        scanlationGroup: c.scanlationGroup,
      })),
    };
  },
  ["manga"],
  CACHE,
);

// ─── Live Dynamic Resolvers (AniList fallback for un-prefetched items) ──────

const liveAnimeCache = new Map<string, { anime: Anime; timestamp: number }>();
const liveMangaCache = new Map<string, { manga: Manga; timestamp: number }>();
const LIVE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const ANILIST_GRAPHQL = "https://graphql.anilist.co";

async function fetchLiveAniListAnime(id: string): Promise<Anime | null> {
  const numId = Number(id);
  if (!numId || isNaN(numId)) return null;

  const cached = liveAnimeCache.get(id);
  if (cached && Date.now() - cached.timestamp < LIVE_CACHE_TTL) {
    return cached.anime;
  }

  try {
    const res = await fetch(ANILIST_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              title { english romaji native }
              description
              coverImage { extraLarge large medium color }
              bannerImage
              status
              averageScore
              popularity
              seasonYear
              startDate { year }
              episodes
              duration
              genres
              trailer { site id }
              studios(isMain: true) { nodes { name } }
              nextAiringEpisode { episode }
            }
          }
        `,
        variables: { id: numId },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const m = json.data?.Media;
    if (!m) return null;

    const title = m.title?.english || m.title?.romaji || `Anime ${m.id}`;
    const nativeTitle = m.title?.romaji || m.title?.native || title;
    const year = m.seasonYear || m.startDate?.year || new Date().getFullYear();
    const epCount = airedEpisodes(m);
    const coverImage = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || "";
    const bannerImage = m.bannerImage || coverImage;
    const duration = m.duration || 24;

    const anime: Anime = {
      id: String(m.id),
      title,
      nativeTitle,
      description: cleanDescription(m.description),
      coverImage,
      bannerImage,
      color: m.coverImage?.color || null,
      status: toStatus(m.status),
      rating: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : 7.5,
      popularity: m.popularity || 0,
      year,
      genres: m.genres || [],
      studio: m.studios?.nodes?.[0]?.name || "Unknown",
      episodeCount: epCount,
      episodeDuration: duration,
      trailerYoutubeId: m.trailer?.site === "youtube" ? m.trailer.id : null,
      seasons: [
        {
          id: String(m.id),
          number: 1,
          title,
          year,
          episodeCount: epCount,
          coverImage,
          bannerImage,
        },
      ],
      links: [],
      episodes: Array.from({ length: epCount }, (_, i) => ({
        id: `${m.id}-s1-e${i + 1}`,
        animeId: String(m.id),
        seasonNumber: 1,
        episodeNumber: i + 1,
        title: `Episode ${i + 1}`,
        videoUrl: "",
        duration,
        thumbnail: bannerImage,
        links: [],
      })),
    };

    liveAnimeCache.set(id, { anime, timestamp: Date.now() });
    return anime;
  } catch (err) {
    console.error(`[fetchLiveAniListAnime] Error for ${id}:`, err);
    return null;
  }
}

async function fetchLiveAniListManga(id: string): Promise<Manga | null> {
  const numId = Number(id);
  if (!numId || isNaN(numId)) return null;

  const cached = liveMangaCache.get(id);
  if (cached && Date.now() - cached.timestamp < LIVE_CACHE_TTL) {
    return cached.manga;
  }

  try {
    const res = await fetch(ANILIST_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `
          query ($id: Int) {
            Media(id: $id, type: MANGA) {
              id
              title { english romaji native }
              description
              coverImage { extraLarge large medium color }
              bannerImage
              status
              averageScore
              popularity
              startDate { year }
              chapters
              volumes
              genres
              externalLinks { url site type language }
              staff(perPage: 2) {
                edges {
                  role
                  node { name { full } }
                }
              }
            }
          }
        `,
        variables: { id: numId },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const m = json.data?.Media;
    if (!m) return null;

    const title = m.title?.english || m.title?.romaji || `Manga ${m.id}`;
    const nativeTitle = m.title?.romaji || m.title?.native || title;
    const year = m.startDate?.year || new Date().getFullYear();
    const coverImage = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || "";
    const bannerImage = m.bannerImage || coverImage;
    const chapterCount = m.chapters || 0;

    const manga: Manga = {
      id: String(m.id),
      title,
      nativeTitle,
      description: cleanDescription(m.description),
      coverImage,
      bannerImage,
      color: m.coverImage?.color || null,
      status: toStatus(m.status),
      rating: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : 7.5,
      popularity: m.popularity || 0,
      year,
      genres: m.genres || [],
      author: m.staff?.edges?.[0]?.node?.name?.full || "Unknown",
      chapterCount,
      volumeCount: m.volumes || null,
      // Real chapters come from MangaDex in getManga; none here rather than fake ones.
      chapters: [],
      links: (m.externalLinks ?? [])
        .filter((l: { type: string; language: string | null }) => l.type === "STREAMING" && (!l.language || l.language === "English"))
        .map((l: { site: string; url: string }) => ({ provider: l.site, url: l.url })),
    };

    liveMangaCache.set(id, { manga, timestamp: Date.now() });
    return manga;
  } catch (err) {
    console.error(`[fetchLiveAniListManga] Error for ${id}:`, err);
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

// connection(): with a database, render per request (from cache) instead of at build time,
// so `next build` never needs the database to be reachable.
export async function getCatalog(): Promise<Catalog> {
  if (!backendEnabled) return demoCatalog();
  await connection();
  return dbCatalog();
}

/** A later season's AniList id (e.g. Stone Ocean) → the id of the series it is stored under; null otherwise. */
export async function parentSeries(id: string): Promise<string | null> {
  if (!backendEnabled) return null;
  await connection();
  const season = await db().season.findUnique({ where: { id }, select: { seriesId: true } });
  return season && season.seriesId !== id ? season.seriesId : null;
}

export async function getAnime(id: string): Promise<Anime | null> {
  let anime: Anime | null = null;
  if (!backendEnabled) {
    anime = animeList.find((a) => a.id === id) ?? null;
  } else {
    await connection();
    anime = await dbAnime(id);
  }

  if (!anime) {
    anime = await fetchLiveAniListAnime(id);
  }

  return anime;
}

export async function getManga(id: string): Promise<Manga | null> {
  let manga: Manga | null = null;
  if (!backendEnabled) {
    manga = mangaList.find((m) => m.id === id) ?? null;
  } else {
    await connection();
    manga = await dbManga(id);
  }

  if (!manga) {
    manga = await fetchLiveAniListManga(id);
  }

  if (!manga) return null;

  // Live MangaDex fills titles the daily sync hasn't reached and chapters released since it ran.
  // The count stays AniList's total: MangaDex having 16 English chapters doesn't make a 200-chapter series short.
  try {
    const liveChapters = await fetchLiveMangaChapters(manga.title, manga.id, manga.id);
    if (liveChapters.length > manga.chapters.length) {
      return {
        ...manga,
        chapterCount: Math.max(manga.chapterCount, liveChapters.length),
        chapters: liveChapters,
      };
    }
  } catch (err) {
    console.warn(`[getManga] MangaDex live chapter fetch failed for ${manga.title}:`, err);
  }

  return manga;
}

/** Live page URLs for a chapter. Empty when the chapter is external-only or MangaDex is unreachable. */
export async function getChapterPages(manga: Manga, chapter: Chapter): Promise<MangaPage[]> {
  if (chapter.mangadexChapterId && !chapter.externalUrl) {
    try {
      const urls = await chapterPages(chapter.mangadexChapterId);
      if (urls.length > 0) {
        return urls.map((imageUrl, i) => ({
          id: `${chapter.id}-pg-${i + 1}`,
          chapterId: chapter.id,
          imageUrl,
          pageNumber: i + 1,
        }));
      }
    } catch (err) {
      console.error("[getChapterPages] MangaDex error:", err);
    }
  }
  // Demo catalog only: placeholder art. With real data an empty list shows "unavailable" instead of fake pages.
  return backendEnabled ? [] : getPages(manga, chapter);
}

/** AniList id of any season → our series id (sequel seasons trend and air under their own ids). */
export const seasonToSeries = (catalog: Catalog) =>
  new Map(catalog.anime.flatMap((a) => a.seasons.map((s) => [Number(s.id), a] as const)));

/** Same-kind titles sharing the most genres, popular first. */
export function related<T extends { id: string; genres: string[]; popularity: number }>(list: T[], of: T, n = 20) {
  const shared = (g: string[]) => g.filter((x) => of.genres.includes(x)).length;
  return list
    .filter((x) => x.id !== of.id && shared(x.genres) > 0)
    .sort((a, b) => shared(b.genres) - shared(a.genres) || b.popularity - a.popularity)
    .slice(0, n);
}

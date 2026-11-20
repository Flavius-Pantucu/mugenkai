import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { animeList, getPages, mangaList } from "@/data/mock-data";
import type { Anime, AnimeSummary, Chapter, Manga, MangaPage, MangaSummary } from "@/data/schema";
import { db } from "./db";
import { backendEnabled } from "./env";
import { chapterPages } from "./sync/mangadex";

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
          chapterCount: r._count.chapters,
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
    const r = await db().series.findUnique({ where: { id, kind: "MANGA" }, include: { chapters: { orderBy: { number: "asc" } } } });
    if (!r) return null;
    const summary = (await dbCatalog()).manga.find((m) => m.id === id);
    if (!summary) return null;
    const { firstChapterId: _first, ...rest } = summary;
    return {
      ...rest,
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

// ─── Public API ──────────────────────────────────────────────────────────────

// connection(): with a database, render per request (from cache) instead of at build time,
// so `next build` never needs the database to be reachable.
export async function getCatalog(): Promise<Catalog> {
  if (!backendEnabled) return demoCatalog();
  await connection();
  return dbCatalog();
}

export async function getAnime(id: string): Promise<Anime | null> {
  if (!backendEnabled) return animeList.find((a) => a.id === id) ?? null;
  await connection();
  return dbAnime(id);
}

export async function getManga(id: string): Promise<Manga | null> {
  if (!backendEnabled) return mangaList.find((m) => m.id === id) ?? null;
  await connection();
  return dbManga(id);
}

/** Live page URLs for a chapter. Empty when the chapter is external-only or MangaDex is unreachable. */
export async function getChapterPages(manga: Manga, chapter: Chapter): Promise<MangaPage[]> {
  if (!backendEnabled) return getPages(manga, chapter);
  if (!chapter.mangadexChapterId || chapter.externalUrl) return [];
  try {
    const urls = await chapterPages(chapter.mangadexChapterId);
    return urls.map((imageUrl, i) => ({ id: `${chapter.id}-pg-${i + 1}`, chapterId: chapter.id, imageUrl, pageNumber: i + 1 }));
  } catch (err) {
    console.error(err);
    return [];
  }
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

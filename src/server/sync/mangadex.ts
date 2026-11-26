import type { Prisma } from "@/generated/prisma/client";
import type { Chapter } from "@/data/schema";
import { db } from "../db";
import { env } from "../env";
import { fetchMangaChaptersWithFallback } from "./manga-providers";
import { pickChapters, type MdChapter } from "./parse";

// MangaDex public API. Rules we follow (https://api.mangadex.org/docs): identify via User-Agent,
// stay under ~5 req/s, credit scanlation groups, never re-host pages (they are loaded from
// MangaDex@Home at read time, see chapterPages()).
const API = "https://api.mangadex.org";
const RATINGS = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let last = 0;

async function get<T>(path: string, attempt = 0): Promise<T> {
  const wait = last + 250 - Date.now(); // ≤ 4 req/s
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const res = await fetch(`${API}${path}`, { headers: { "User-Agent": env.MANGADEX_USER_AGENT }, cache: "no-store" });
  if (res.status === 429 && attempt < 3) {
    await sleep(5000 * (attempt + 1));
    return get(path, attempt + 1);
  }
  if (!res.ok) throw new Error(`MangaDex ${path.split("?")[0]}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface MdManga {
  id: string;
  attributes: { links: Record<string, string> | null };
}
/** MangaDex records the AniList id in links.al, so the match is exact, not a fuzzy title guess. */
async function findMangadexId(title: string, anilistId: string) {
  const res = await get<{ data: MdManga[] }>(`/manga?title=${encodeURIComponent(title)}&limit=10&${RATINGS}`);
  return res.data.find((m) => m.attributes.links?.al === anilistId)?.id ?? null;
}

async function syncChapters(seriesId: string, mangadexId: string) {
  const rows: MdChapter[] = [];
  for (let offset = 0; offset < 10_000; offset += 500) {
    const page = await get<{ data: MdChapter[]; total: number }>(
      `/manga/${mangadexId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&offset=${offset}&includes[]=scanlation_group&${RATINGS}`,
    );
    rows.push(...page.data);
    if (offset + 500 >= page.total) break;
  }

  const chapters: Prisma.ChapterCreateManyInput[] = pickChapters(rows).map(([n, c]) => ({
    id: `${seriesId}-ch-${n}`,
    seriesId,
    number: n,
    title: c.attributes.title?.trim() || `Chapter ${n}`,
    pageCount: c.attributes.externalUrl ? 0 : c.attributes.pages,
    mangadexChapterId: c.id,
    externalUrl: c.attributes.externalUrl,
    scanlationGroup: c.relationships.find((r) => r.type === "scanlation_group")?.attributes?.name ?? null,
    publishedAt: new Date(c.attributes.publishAt),
  }));
  const { count } = await db().chapter.createMany({ data: chapters, skipDuplicates: true });
  return count;
}

async function saveFallbackChapters(seriesId: string, title: string, nativeTitle: string) {
  const fallback = await fetchMangaChaptersWithFallback(title, seriesId, seriesId, nativeTitle);
  if (fallback.length === 0) return 0;
  const rows: Prisma.ChapterCreateManyInput[] = fallback.map((c) => ({
    id: `${seriesId}-ch-${c.chapterNumber}`,
    seriesId,
    number: c.chapterNumber,
    title: c.title,
    pageCount: c.pageCount,
    mangadexChapterId: c.mangadexChapterId ?? null,
    externalUrl: c.externalUrl ?? null,
    scanlationGroup: c.scanlationGroup ?? null,
    publishedAt: c.releasedAt ? new Date(c.releasedAt) : null,
  }));
  const { count } = await db().chapter.createMany({ data: rows, skipDuplicates: true });
  return count;
}

/** Daily: map new manga to MangaDex and add any chapters published since the last run, falling back to Consumet providers when MangaDex has none. */
export async function syncMangaChapters() {
  const manga = await db().series.findMany({
    where: { kind: "MANGA" },
    select: { id: true, title: true, nativeTitle: true, mangadexId: true, _count: { select: { chapters: true } } },
  });
  let mapped = 0;
  let added = 0;
  const unmatched: string[] = [];
  for (const m of manga) {
    let mdId = m.mangadexId;
    if (!mdId) {
      mdId = await findMangadexId(m.title, m.id);
      if (mdId) {
        await db().series.update({ where: { id: m.id }, data: { mangadexId: mdId } });
        mapped++;
      }
    }
    let chAdded = mdId ? await syncChapters(m.id, mdId) : 0;
    if (chAdded === 0 && m._count.chapters === 0) {
      chAdded = await saveFallbackChapters(m.id, m.title, m.nativeTitle);
    }
    added += chAdded;
    if (chAdded === 0 && m._count.chapters === 0) {
      unmatched.push(m.title);
    }
  }
  return { manga: manga.length, mapped, chaptersAdded: added, unmatched };
}

/** Targeted fallback sync for manga that currently have 0 chapters in the database. */
export async function syncMissingMangaChapters(limit = 30) {
  const missing = await db().series.findMany({
    where: { kind: "MANGA", chapters: { none: {} } },
    orderBy: { popularity: "desc" },
    take: limit,
    select: { id: true, title: true, nativeTitle: true },
  });
  let filled = 0;
  let chaptersAdded = 0;
  for (const m of missing) {
    const count = await saveFallbackChapters(m.id, m.title, m.nativeTitle);
    if (count > 0) {
      filled++;
      chaptersAdded += count;
    }
  }
  return { checked: missing.length, filled, chaptersAdded };
}

/**
 * Page image URLs for one chapter, from MangaDex@Home. The base URL is short-lived (~15 min),
 * so this runs at read time and is never cached or stored.
 */
export async function chapterPages(mangadexChapterId: string): Promise<string[]> {
  const at = await get<{ baseUrl: string; chapter: { hash: string; data: string[] } }>(`/at-home/server/${mangadexChapterId}`);
  return at.chapter.data.map((file) => `${at.baseUrl}/data/${at.chapter.hash}/${file}`);
}

const liveChapterCache = new Map<string, { chapters: Chapter[]; timestamp: number }>();
const CHAPTER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch real chapters live from MangaDex for any manga, using its title and AniList id.
 */
export async function fetchLiveMangaChapters(title: string, anilistId: string, seriesId: string): Promise<Chapter[]> {
  const cacheKey = seriesId || anilistId;
  const cached = liveChapterCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CHAPTER_CACHE_TTL) {
    return cached.chapters;
  }

  try {
    // Exact AniList match only: the first search hit is often a spin-off or a different series.
    const mdId = await findMangadexId(title, anilistId);
    if (!mdId) return [];

    const rows: MdChapter[] = [];
    for (let offset = 0; offset < 10_000; offset += 500) {
      const page = await get<{ data: MdChapter[]; total: number }>(
        `/manga/${mdId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&offset=${offset}&includes[]=scanlation_group&${RATINGS}`,
      );
      rows.push(...page.data);
      if (offset + 500 >= page.total) break;
    }

    const picked = pickChapters(rows);
    const chapters: Chapter[] = picked.map(([n, c]) => ({
      id: `${seriesId}-ch-${n}`,
      mangaId: seriesId,
      chapterNumber: n,
      title: c.attributes.title?.trim() || `Chapter ${n}`,
      pageCount: c.attributes.externalUrl ? 0 : c.attributes.pages,
      mangadexChapterId: c.id,
      externalUrl: c.attributes.externalUrl,
      scanlationGroup: c.relationships?.find((r) => r.type === "scanlation_group")?.attributes?.name ?? null,
    }));

    liveChapterCache.set(cacheKey, { chapters, timestamp: Date.now() });
    return chapters;
  } catch (err: any) {
    console.warn(`[MangaDex] Live chapters error for "${title}":`, err?.message || err);
    return [];
  }
}

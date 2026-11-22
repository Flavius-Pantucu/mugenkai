import type { Chapter } from "@/data/schema";
import { parseChapterNumber } from "./parse";

// In-memory cache for chapters & pages
const providerChaptersCache = new Map<string, { chapters: Chapter[]; timestamp: number }>();
const providerPagesCache = new Map<string, { pages: string[]; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getConsumetManga() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ext = require("@consumet/extensions");
    return ext.MANGA || null;
  } catch (err: any) {
    console.warn("[MangaProviders] Could not load @consumet/extensions:", err?.message || err);
    return null;
  }
}

function normalizeTitle(t: string): string {
  return (t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Primary Provider: MangaPill
 * Comprehensive full chapter feeds (e.g. One Piece 1200+ chs, Naruto 700+ chs, Berserk 380+ chs, Spy x Family 175+ chs),
 * high availability, no Cloudflare blocks.
 */
async function fetchMangaPillChapters(title: string, seriesId: string): Promise<Chapter[]> {
  const MANGA = getConsumetManga();
  if (!MANGA?.MangaPill) return [];

  try {
    const pill = new MANGA.MangaPill();
    const cleanQuery = title.replace(/×/g, " x ").replace(/[:\-]/g, " ").trim();
    const search = await pill.search(cleanQuery);
    if (!search?.results || search.results.length === 0) return [];

    const norm = normalizeTitle(cleanQuery);
    const bestMatch =
      search.results.find((r: any) => normalizeTitle(r.title) === norm) ||
      search.results.find((r: any) => normalizeTitle(r.title).includes(norm)) ||
      search.results[0];

    if (!bestMatch?.id) return [];

    const info = await pill.fetchMangaInfo(bestMatch.id);
    if (!info?.chapters || info.chapters.length === 0) return [];

    const seen = new Set<number>();
    const mapped: Chapter[] = [];
    const rawChapters = [...info.chapters].reverse();

    for (let i = 0; i < rawChapters.length; i++) {
      const c = rawChapters[i];
      const num = parseChapterNumber(c.chapter || c.title || c.id, i);
      if (seen.has(num)) continue;
      seen.add(num);

      mapped.push({
        id: `${seriesId}-ch-${num}`,
        mangaId: seriesId,
        chapterNumber: num,
        title: c.title?.trim() || `Chapter ${num}`,
        pageCount: 20,
        externalUrl: null,
        mangadexChapterId: `mangapill:${c.id}`,
        scanlationGroup: "MangaPill",
      });
    }

    mapped.sort((a, b) => a.chapterNumber - b.chapterNumber);
    return mapped;
  } catch (err: any) {
    console.warn(`[MangaProviders] MangaPill failed for "${title}":`, err?.message || err);
    return [];
  }
}

/**
 * Secondary Provider: WeebCentral
 * High-definition official digital scans archive.
 */
async function fetchWeebCentralChapters(title: string, seriesId: string): Promise<Chapter[]> {
  const MANGA = getConsumetManga();
  if (!MANGA?.WeebCentral) return [];

  try {
    const wc = new MANGA.WeebCentral();
    const cleanQuery = title.replace(/×/g, " x ").replace(/[:\-]/g, " ").trim();
    const search = await wc.search(cleanQuery);
    if (!search?.results || search.results.length === 0) return [];

    const norm = normalizeTitle(cleanQuery);
    const bestMatch =
      search.results.find((r: any) => normalizeTitle(r.title) === norm) ||
      search.results.find((r: any) => normalizeTitle(r.title).includes(norm)) ||
      search.results[0];

    if (!bestMatch?.id) return [];

    const info = await wc.fetchMangaInfo(bestMatch.id);
    if (!info?.chapters || info.chapters.length === 0) return [];

    const seen = new Set<number>();
    const mapped: Chapter[] = [];
    const rawChapters = [...info.chapters].reverse();

    for (let i = 0; i < rawChapters.length; i++) {
      const c = rawChapters[i];
      const num = parseChapterNumber(c.title || c.id, i);
      if (seen.has(num)) continue;
      seen.add(num);

      mapped.push({
        id: `${seriesId}-ch-${num}`,
        mangaId: seriesId,
        chapterNumber: num,
        title: c.title?.trim() || `Chapter ${num}`,
        pageCount: 20,
        externalUrl: null,
        mangadexChapterId: `weebcentral:${c.id}`,
        scanlationGroup: "WeebCentral / Digital",
      });
    }

    mapped.sort((a, b) => a.chapterNumber - b.chapterNumber);
    return mapped;
  } catch (err: any) {
    console.warn(`[MangaProviders] WeebCentral failed for "${title}":`, err?.message || err);
    return [];
  }
}

/**
 * Fetches all readable chapters for a manga using comprehensive manga providers (MangaPill & WeebCentral).
 * MangaDex is not used for chapters due to missing and restricted/external-only chapters.
 */
export async function fetchMangaChaptersWithFallback(
  title: string,
  anilistId: string,
  seriesId: string
): Promise<Chapter[]> {
  const cacheKey = seriesId || anilistId;
  const cached = providerChaptersCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.chapters;
  }

  // 1. Try MangaPill (complete archives, all chapters, unblocked)
  try {
    const pillChapters = await fetchMangaPillChapters(title, seriesId);
    if (pillChapters.length > 0) {
      providerChaptersCache.set(cacheKey, { chapters: pillChapters, timestamp: Date.now() });
      return pillChapters;
    }
  } catch (e: any) {
    console.warn(`[MangaProviders] MangaPill error for "${title}":`, e?.message || e);
  }

  // 2. Fallback to WeebCentral (official high-res digital scans)
  try {
    const wcChapters = await fetchWeebCentralChapters(title, seriesId);
    if (wcChapters.length > 0) {
      providerChaptersCache.set(cacheKey, { chapters: wcChapters, timestamp: Date.now() });
      return wcChapters;
    }
  } catch (e: any) {
    console.warn(`[MangaProviders] WeebCentral error for "${title}":`, e?.message || e);
  }

  return [];
}

/**
 * Universal chapter page fetcher across MangaPill and WeebCentral.
 */
export async function fetchChapterPagesWithFallback(providerChapterId: string): Promise<string[]> {
  if (!providerChapterId) return [];

  const cached = providerPagesCache.get(providerChapterId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.pages;
  }

  let pages: string[] = [];

  try {
    if (providerChapterId.startsWith("mangapill:")) {
      const chapterId = providerChapterId.replace("mangapill:", "");
      const MANGA = getConsumetManga();
      if (MANGA?.MangaPill) {
        const pill = new MANGA.MangaPill();
        const rawPages = await pill.fetchChapterPages(chapterId);
        pages = (rawPages || []).map((p: any) => p.img || p.url).filter(Boolean);
      }
    } else if (providerChapterId.startsWith("weebcentral:")) {
      const chapterId = providerChapterId.replace("weebcentral:", "");
      const MANGA = getConsumetManga();
      if (MANGA?.WeebCentral) {
        const wc = new MANGA.WeebCentral();
        const rawPages = await wc.fetchChapterPages(chapterId);
        pages = (rawPages || []).map((p: any) => p.img || p.url).filter(Boolean);
      }
    }
  } catch (err: any) {
    console.error(`[MangaProviders] Failed to fetch pages for ${providerChapterId}:`, err?.message || err);
  }

  if (pages.length > 0) {
    providerPagesCache.set(providerChapterId, { pages, timestamp: Date.now() });
  }

  return pages;
}

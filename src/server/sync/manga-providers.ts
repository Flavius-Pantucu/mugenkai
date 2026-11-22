import type { Chapter } from "@/data/schema";
import { chapterPages, fetchLiveMangaChapters } from "./mangadex";
import { parseChapterNumber } from "./parse";

// In-memory cache for fallback chapters & pages
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
 * Fallback Provider 1: MangaPill
 * Fast, reliable, no Cloudflare blocks, extensive library including official rips.
 */
async function fetchMangaPillChapters(title: string, seriesId: string): Promise<Chapter[]> {
  const MANGA = getConsumetManga();
  if (!MANGA?.MangaPill) return [];

  try {
    const pill = new MANGA.MangaPill();
    const search = await pill.search(title);
    if (!search?.results || search.results.length === 0) return [];

    const norm = normalizeTitle(title);
    const bestMatch =
      search.results.find((r: any) => normalizeTitle(r.title) === norm) ||
      search.results.find((r: any) => normalizeTitle(r.title).includes(norm)) ||
      search.results[0];

    if (!bestMatch?.id) return [];

    const info = await pill.fetchMangaInfo(bestMatch.id);
    if (!info?.chapters || info.chapters.length === 0) return [];

    // Map and deduplicate by chapter number
    const seen = new Set<number>();
    const mapped: Chapter[] = [];

    // MangaPill chapters are typically ordered newest to oldest, reverse to get asc
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
        pageCount: 20, // default placeholder until pages are retrieved
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
 * Fallback Provider 2: WeebCentral
 * High-definition official digital scans for major manga.
 */
async function fetchWeebCentralChapters(title: string, seriesId: string): Promise<Chapter[]> {
  const MANGA = getConsumetManga();
  if (!MANGA?.WeebCentral) return [];

  try {
    const wc = new MANGA.WeebCentral();
    const search = await wc.search(title);
    if (!search?.results || search.results.length === 0) return [];

    const norm = normalizeTitle(title);
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
 * Multi-source chapter resolver:
 * 1. Primary: MangaDex (community scanlations, exact AniList ID matching).
 * 2. Fallback 1: MangaPill (unblocked, full archives, official rips).
 * 3. Fallback 2: WeebCentral (high-res official digital scans).
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

  // 1. Try MangaDex
  let chapters: Chapter[] = [];
  try {
    chapters = await fetchLiveMangaChapters(title, anilistId, seriesId);
  } catch (e: any) {
    console.warn(`[MangaProviders] MangaDex error for "${title}":`, e?.message || e);
  }

  // Check if MangaDex results are usable:
  // If MangaDex returned 0 chapters OR all/most chapters are external-only (e.g. Manga Plus restrictions)
  const nonExternalCount = chapters.filter((c) => !c.externalUrl && c.mangadexChapterId).length;
  const isUsableMangaDex = chapters.length > 0 && nonExternalCount >= Math.min(chapters.length * 0.4, 5);

  if (isUsableMangaDex) {
    providerChaptersCache.set(cacheKey, { chapters, timestamp: Date.now() });
    return chapters;
  }

  console.log(`[MangaProviders] MangaDex insufficient for "${title}" (${nonExternalCount}/${chapters.length} readable). Trying MangaPill...`);

  // 2. Try MangaPill
  try {
    const pillChapters = await fetchMangaPillChapters(title, seriesId);
    if (pillChapters.length > 0) {
      console.log(`[MangaProviders] MangaPill resolved ${pillChapters.length} chapters for "${title}".`);
      providerChaptersCache.set(cacheKey, { chapters: pillChapters, timestamp: Date.now() });
      return pillChapters;
    }
  } catch (e: any) {
    console.warn(`[MangaProviders] MangaPill error for "${title}":`, e?.message || e);
  }

  // 3. Try WeebCentral
  console.log(`[MangaProviders] Trying WeebCentral for "${title}"...`);
  try {
    const wcChapters = await fetchWeebCentralChapters(title, seriesId);
    if (wcChapters.length > 0) {
      console.log(`[MangaProviders] WeebCentral resolved ${wcChapters.length} chapters for "${title}".`);
      providerChaptersCache.set(cacheKey, { chapters: wcChapters, timestamp: Date.now() });
      return wcChapters;
    }
  } catch (e: any) {
    console.warn(`[MangaProviders] WeebCentral error for "${title}":`, e?.message || e);
  }

  // Fallback to whatever MangaDex had (even if partial or external)
  if (chapters.length > 0) {
    providerChaptersCache.set(cacheKey, { chapters, timestamp: Date.now() });
    return chapters;
  }

  return [];
}

/**
 * Universal chapter page fetcher across MangaDex, MangaPill, and WeebCentral.
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
    } else {
      // Standard MangaDex chapter ID
      pages = await chapterPages(providerChapterId);
    }
  } catch (err: any) {
    console.error(`[MangaProviders] Failed to fetch pages for ${providerChapterId}:`, err?.message || err);
  }

  if (pages.length > 0) {
    providerPagesCache.set(providerChapterId, { pages, timestamp: Date.now() });
  }

  return pages;
}

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

const JUNK_REGEX = /\b(novel|art[\s-]*book|guidebook|anthology|fan[\s-]*version|doujinshi|character[\s-]*book)\b/i;
const PENALTY_REGEX = /\b(colored|color|the best of|side story|birth of|chibi|junior high|gaiden|special|before the fall|lost girls)\b/i;

function scoreCandidate(itemTitle: string, query: string, nativeQuery?: string): number {
  const t = itemTitle.toLowerCase();
  if (JUNK_REGEX.test(t)) return -1;
  const normItem = normalizeTitle(t);
  const normQ = normalizeTitle(query);
  const normNat = nativeQuery ? normalizeTitle(nativeQuery) : "";

  let score = 0;
  if (normItem === normQ || (normNat && normItem === normNat)) {
    score = 100;
  } else if (normItem.includes(normQ) || (normNat && normItem.includes(normNat))) {
    score = 80;
  } else {
    return 0; // Not a match
  }

  if (PENALTY_REGEX.test(t)) {
    score -= 30;
  }
  return score;
}

/**
 * Primary Provider: MangaPill
 * Comprehensive full chapter feeds (e.g. One Piece 1200+ chs, Naruto 700+ chs, Berserk 380+ chs, Spy x Family 175+ chs),
 * high availability, no Cloudflare blocks.
 */
async function fetchMangaPillChapters(title: string, seriesId: string, nativeTitle?: string): Promise<Chapter[]> {
  const MANGA = getConsumetManga();
  if (!MANGA?.MangaPill) return [];

  try {
    const pill = new MANGA.MangaPill();
    const cleanQuery = title.replace(/×/g, " x ").replace(/[:\-]/g, " ").trim();
    const search = await pill.search(cleanQuery);
    let candidates = (search?.results || [])
      .map((r: any) => ({ ...r, score: scoreCandidate(r.title, title, nativeTitle) }))
      .filter((r: any) => r.score >= 50)
      .sort((a: any, b: any) => b.score - a.score);

    if (candidates.length === 0 && nativeTitle && nativeTitle !== title) {
      const cleanNat = nativeTitle.replace(/×/g, " x ").replace(/[:\-]/g, " ").trim();
      const searchNat = await pill.search(cleanNat);
      candidates = (searchNat?.results || [])
        .map((r: any) => ({ ...r, score: scoreCandidate(r.title, title, nativeTitle) }))
        .filter((r: any) => r.score >= 50)
        .sort((a: any, b: any) => b.score - a.score);
    }

    if (candidates.length === 0) return [];

    for (const bestMatch of candidates.slice(0, 3)) {
      if (!bestMatch?.id) continue;
      const info = await pill.fetchMangaInfo(bestMatch.id);
      if (!info?.chapters || info.chapters.length === 0) continue;

      if (info.chapters.length < 5 && bestMatch.score < 100 && candidates.length > 1) {
        continue;
      }

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

      if (mapped.length > 0) {
        mapped.sort((a, b) => a.chapterNumber - b.chapterNumber);
        return mapped;
      }
    }

    return [];
  } catch (err: any) {
    console.warn(`[MangaProviders] MangaPill failed for "${title}":`, err?.message || err);
    return [];
  }
}

/**
 * Secondary Provider: WeebCentral
 * High-definition official digital scans archive.
 */
async function fetchWeebCentralChapters(title: string, seriesId: string, nativeTitle?: string): Promise<Chapter[]> {
  const MANGA = getConsumetManga();
  if (!MANGA?.WeebCentral) return [];

  try {
    const wc = new MANGA.WeebCentral();
    const cleanQuery = title.replace(/×/g, " x ").replace(/[:\-]/g, " ").trim();
    const search = await wc.search(cleanQuery);
    let candidates = (search?.results || [])
      .map((r: any) => ({ ...r, score: scoreCandidate(r.title, title, nativeTitle) }))
      .filter((r: any) => r.score >= 50)
      .sort((a: any, b: any) => b.score - a.score);

    if (candidates.length === 0 && nativeTitle && nativeTitle !== title) {
      const cleanNat = nativeTitle.replace(/×/g, " x ").replace(/[:\-]/g, " ").trim();
      const searchNat = await wc.search(cleanNat);
      candidates = (searchNat?.results || [])
        .map((r: any) => ({ ...r, score: scoreCandidate(r.title, title, nativeTitle) }))
        .filter((r: any) => r.score >= 50)
        .sort((a: any, b: any) => b.score - a.score);
    }

    if (candidates.length === 0) return [];

    for (const bestMatch of candidates.slice(0, 3)) {
      if (!bestMatch?.id) continue;
      const info = await wc.fetchMangaInfo(bestMatch.id);
      if (!info?.chapters || info.chapters.length === 0) continue;

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

      if (mapped.length > 0) {
        mapped.sort((a, b) => a.chapterNumber - b.chapterNumber);
        return mapped;
      }
    }

    return [];
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
  seriesId: string,
  nativeTitle?: string,
): Promise<Chapter[]> {
  const cacheKey = seriesId || anilistId;
  const cached = providerChaptersCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.chapters;
  }

  // 1. Try MangaPill (complete archives, all chapters, unblocked)
  try {
    const pillChapters = await fetchMangaPillChapters(title, seriesId, nativeTitle);
    if (pillChapters.length > 0) {
      providerChaptersCache.set(cacheKey, { chapters: pillChapters, timestamp: Date.now() });
      return pillChapters;
    }
  } catch (e: any) {
    console.warn(`[MangaProviders] MangaPill error for "${title}":`, e?.message || e);
  }

  // 2. Fallback to WeebCentral (official high-res digital scans)
  try {
    const wcChapters = await fetchWeebCentralChapters(title, seriesId, nativeTitle);
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

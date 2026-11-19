"use client";

import { animeList, mangaList, type Anime, type Chapter, type Episode, type Manga } from "@/data/mock-data";
import { ProgressStateSchema, type ProgressState } from "@/data/schema";
import { createLocalStore } from "./local-store";

/** An episode counts as watched past this point (credits). */
export const WATCHED_AT = 95;

const EMPTY: ProgressState = { episodes: {}, chapters: {} };
const store = createLocalStore("mugenkai:progress", ProgressStateSchema, EMPTY);

export const useProgress = store.useValue;
/** Current value outside React render (e.g. to restore a position when a page opens). */
export const getProgress = store.read;

export function saveEpisodeProgress(episodeId: string, progress: number) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
  store.write((s) => ({ ...s, episodes: { ...s.episodes, [episodeId]: { progress: pct, updatedAt: Date.now() } } }));
}

export function saveChapterPage(chapter: Chapter, page: number) {
  const p = Math.min(chapter.pageCount, Math.max(1, page));
  store.write((s) => ({ ...s, chapters: { ...s.chapters, [chapter.id]: { page: p, pageCount: chapter.pageCount, updatedAt: Date.now() } } }));
}

export const savedEpisode = (s: ProgressState, episodeId: string) => s.episodes[episodeId];
export const savedChapter = (s: ProgressState, chapterId: string) => s.chapters[chapterId];

/** 0-100; anything past the credits counts as fully watched. */
export function episodeProgress(s: ProgressState, ep: Episode) {
  const p = s.episodes[ep.id]?.progress ?? 0;
  return p >= WATCHED_AT ? 100 : p;
}

/** 0-100; reaching the last page counts as read. */
export function chapterProgress(s: ProgressState, ch: Chapter) {
  const e = s.chapters[ch.id];
  return e ? Math.round((e.page / e.pageCount) * 100) : 0;
}

// Lookups from stored ids back to the catalog.
const episodeIndex = new Map(animeList.flatMap((a) => a.episodes.map((e, i) => [e.id, { anime: a, index: i }] as const)));
const chapterIndex = new Map(mangaList.flatMap((m) => m.chapters.map((c, i) => [c.id, { manga: m, index: i }] as const)));

/** Latest-touched entry per series, newest first. */
function latestPerSeries<E extends { updatedAt: number }, H extends { index: number }>(
  entries: Record<string, E>,
  index: Map<string, H>,
  seriesId: (h: H) => string,
) {
  const latest = new Map<string, { hit: H; entry: E }>();
  for (const [id, entry] of Object.entries(entries)) {
    const hit = index.get(id);
    if (!hit) continue; // stale id from an older catalog
    const key = seriesId(hit);
    const cur = latest.get(key);
    if (!cur || entry.updatedAt > cur.entry.updatedAt) latest.set(key, { hit, entry });
  }
  return [...latest.values()].sort((a, b) => b.entry.updatedAt - a.entry.updatedAt);
}

export interface WatchingItem {
  anime: Anime;
  episode: Episode;
  progress: number;
}

/** One card per show: the episode in progress, or the next one once it was finished. */
export function continueWatching(s: ProgressState): WatchingItem[] {
  return latestPerSeries(s.episodes, episodeIndex, (h) => h.anime.id).flatMap(({ hit, entry }) => {
    if (entry.progress < WATCHED_AT) return [{ anime: hit.anime, episode: hit.anime.episodes[hit.index], progress: entry.progress }];
    const next = hit.anime.episodes[hit.index + 1];
    return next ? [{ anime: hit.anime, episode: next, progress: 0 }] : [];
  });
}

export interface ReadingItem {
  manga: Manga;
  chapter: Chapter;
  page: number;
}

/** One card per manga: the open chapter and page, or the next chapter once one was finished. */
export function continueReading(s: ProgressState): ReadingItem[] {
  return latestPerSeries(s.chapters, chapterIndex, (h) => h.manga.id).flatMap(({ hit, entry }) => {
    if (entry.page < entry.pageCount) return [{ manga: hit.manga, chapter: hit.manga.chapters[hit.index], page: entry.page }];
    const next = hit.manga.chapters[hit.index + 1];
    return next ? [{ manga: hit.manga, chapter: next, page: 1 }] : [];
  });
}

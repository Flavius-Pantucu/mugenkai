"use client";

import { episodeId, parseChapterId, parseEpisodeId } from "@/data/series";
import { ProgressStateSchema, type AnimeSummary, type Chapter, type Episode, type MangaSummary, type ProgressState } from "@/data/schema";
import { api, isRemote } from "./api";
import { createLocalStore } from "./local-store";

/** An episode counts as watched past this point (credits). */
export const WATCHED_AT = 95;

// The browser store is always the source the UI reads (instant, works signed out).
// When signed in to a real backend, every write is also sent to the API, and on sign-in the
// two are merged (newest wins) by syncProgressWithAccount().

const EMPTY: ProgressState = { episodes: {}, chapters: {} };
const store = createLocalStore("mugenkai:progress", ProgressStateSchema, EMPTY);

export const useProgress = store.useValue;
/** Current value outside React render (e.g. to restore a position when a page opens). */
export const getProgress = store.read;

const push = (path: string, body: unknown) => {
  if (isRemote()) void api(path, { method: "PUT", body }).catch((err) => console.warn("progress sync failed", err));
};

export function saveEpisodeProgress(id: string, progress: number) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
  const updatedAt = Date.now();
  store.write((s) => ({ ...s, episodes: { ...s.episodes, [id]: { progress: pct, updatedAt } } }));
  push("/api/progress/episode", { episodeId: id, progress: pct, updatedAt });
}

export function saveChapterPage(chapter: Chapter, page: number) {
  const p = Math.min(chapter.pageCount, Math.max(1, page));
  const updatedAt = Date.now();
  store.write((s) => ({ ...s, chapters: { ...s.chapters, [chapter.id]: { page: p, pageCount: chapter.pageCount, updatedAt } } }));
  push("/api/progress/chapter", { chapterId: chapter.id, page: p, pageCount: chapter.pageCount, updatedAt });
}

/** Marks a whole season or volume finished at once; one request when signed in. */
export function markFinished(episodeIds: string[], chapters: { id: string; pageCount: number }[]) {
  const updatedAt = Date.now();
  const done = (pageCount: number) => ({ page: Math.max(1, pageCount), pageCount: Math.max(1, pageCount), updatedAt });
  store.write((s) => ({
    episodes: { ...s.episodes, ...Object.fromEntries(episodeIds.map((id) => [id, { progress: 100, updatedAt }])) },
    chapters: { ...s.chapters, ...Object.fromEntries(chapters.map((c) => [c.id, done(c.pageCount)])) },
  }));
  if (isRemote()) void syncProgressWithAccount().catch((err) => console.warn("progress sync failed", err));
}

/** On sign-in: upload what was saved while signed out, then adopt the merged account state. */
export async function syncProgressWithAccount() {
  const { state } = await api<{ state: ProgressState }>("/api/progress", { body: store.read() });
  store.write(() => ProgressStateSchema.parse(state));
}

/** On sign-out: forget this account's progress on this device. */
export const clearLocalProgress = () => store.write(() => EMPTY);

/** 0-100; anything past the credits counts as fully watched. */
export function episodeProgress(s: ProgressState, ep: Pick<Episode, "id">) {
  const p = s.episodes[ep.id]?.progress ?? 0;
  return p >= WATCHED_AT ? 100 : p;
}

/** 0-100; reaching the last page counts as read. */
export function chapterProgress(s: ProgressState, ch: Pick<Chapter, "id">) {
  const e = s.chapters[ch.id];
  return e ? Math.round((e.page / e.pageCount) * 100) : 0;
}

/** Latest-touched entry per series, newest first. */
function latestPerSeries<E extends { updatedAt: number }>(entries: Record<string, E>, seriesOf: (id: string) => string | undefined) {
  const latest = new Map<string, { id: string; entry: E }>();
  for (const [id, entry] of Object.entries(entries)) {
    const series = seriesOf(id);
    if (!series) continue;
    const cur = latest.get(series);
    if (!cur || entry.updatedAt > cur.entry.updatedAt) latest.set(series, { id, entry });
  }
  return [...latest.values()].sort((a, b) => b.entry.updatedAt - a.entry.updatedAt);
}

export interface WatchingItem {
  anime: AnimeSummary;
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  thumbnail: string;
  progress: number;
}

/** One card per show: the episode in progress, or the next one once it was finished. */
export function continueWatching(s: ProgressState, anime: AnimeSummary[]): WatchingItem[] {
  const byId = new Map(anime.map((a) => [a.id, a]));
  return latestPerSeries(s.episodes, (id) => parseEpisodeId(id)?.animeId).flatMap(({ id, entry }) => {
    const ref = parseEpisodeId(id)!;
    const a = byId.get(ref.animeId);
    const season = a?.seasons.find((x) => x.number === ref.season);
    if (!a || !season) return [];
    let { season: sn, number: n } = ref;
    let progress = entry.progress;
    if (progress >= WATCHED_AT) {
      progress = 0;
      if (n < season.episodeCount) n++;
      else if (a.seasons.some((x) => x.number === sn + 1)) [sn, n] = [sn + 1, 1];
      else return []; // finished the show
    }
    const thumb = a.seasons.find((x) => x.number === sn)?.bannerImage ?? a.bannerImage;
    return [{ anime: a, episodeId: episodeId(a.id, sn, n), seasonNumber: sn, episodeNumber: n, thumbnail: thumb, progress }];
  });
}

export interface ReadingItem {
  manga: MangaSummary;
  chapterId: string;
  chapterNumber: number;
  page: number;
  pageCount: number;
}

/** One card per manga with the chapter left open. Finished chapters resume from the manga page. */
export function continueReading(s: ProgressState, manga: MangaSummary[]): ReadingItem[] {
  const byId = new Map(manga.map((m) => [m.id, m]));
  return latestPerSeries(s.chapters, (id) => parseChapterId(id)?.mangaId).flatMap(({ id, entry }) => {
    const ref = parseChapterId(id)!;
    const m = byId.get(ref.mangaId);
    return m ? [{ manga: m, chapterId: id, chapterNumber: ref.number, page: entry.page, pageCount: entry.pageCount }] : [];
  });
}

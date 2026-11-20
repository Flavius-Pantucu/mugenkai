import { revalidateTag } from "next/cache";
import { db } from "../db";
import { env } from "../env";
import { syncAiring, syncCatalog } from "./anilist";
import { syncMangaChapters } from "./mangadex";

export const JOBS = {
  /** Daily. Top anime (all seasons, episodes, official links) and top manga metadata from AniList. */
  catalog: () => syncCatalog(env.SYNC_TOP_ANIME, env.SYNC_TOP_MANGA),
  /** Hourly. New episodes of airing seasons. */
  airing: () => syncAiring(),
  /** Daily, after catalog. Chapters from MangaDex. */
  manga: () => syncMangaChapters(),
} as const;

export type JobName = keyof typeof JOBS;
export const isJobName = (s: string): s is JobName => s in JOBS;

/** Runs a job, records the outcome in SyncState, and refreshes cached catalog pages. */
export async function runJob(name: JobName) {
  const startedAt = new Date();
  await db().syncState.upsert({ where: { job: name }, create: { job: name, lastRunAt: startedAt }, update: { lastRunAt: startedAt } });
  try {
    const summary = await JOBS[name]();
    await db().syncState.update({ where: { job: name }, data: { lastOkAt: new Date(), lastError: null, summary } });
    revalidateTag("catalog", "max");
    return { ok: true as const, job: name, ms: Date.now() - startedAt.getTime(), summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db().syncState.update({ where: { job: name }, data: { lastError: message.slice(0, 1000) } });
    return { ok: false as const, job: name, ms: Date.now() - startedAt.getTime(), error: message };
  }
}

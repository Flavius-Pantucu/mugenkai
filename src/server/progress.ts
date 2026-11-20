import type { ProgressState } from "@/data/schema";
import { db } from "./db";

// Progress writes keep the newest value: a stale tab or an imported guest entry never
// overwrites something watched more recently on another device.

export async function readProgress(userId: string): Promise<ProgressState> {
  const [episodes, chapters] = await Promise.all([
    db().episodeProgress.findMany({ where: { userId } }),
    db().chapterProgress.findMany({ where: { userId } }),
  ]);
  return {
    episodes: Object.fromEntries(episodes.map((e) => [e.episodeId, { progress: e.progress, updatedAt: e.updatedAt.getTime() }])),
    chapters: Object.fromEntries(chapters.map((c) => [c.chapterId, { page: c.page, pageCount: c.pageCount, updatedAt: c.updatedAt.getTime() }])),
  };
}

export async function writeEpisode(userId: string, episodeId: string, progress: number, updatedAt = Date.now()) {
  const at = new Date(Math.min(updatedAt, Date.now()));
  const existing = await db().episodeProgress.findUnique({ where: { userId_episodeId: { userId, episodeId } } });
  if (existing && existing.updatedAt >= at) return false;
  await db().episodeProgress.upsert({
    where: { userId_episodeId: { userId, episodeId } },
    create: { userId, episodeId, progress, updatedAt: at },
    update: { progress, updatedAt: at },
  });
  return true;
}

export async function writeChapter(userId: string, chapterId: string, page: number, pageCount: number, updatedAt = Date.now()) {
  const at = new Date(Math.min(updatedAt, Date.now()));
  const existing = await db().chapterProgress.findUnique({ where: { userId_chapterId: { userId, chapterId } } });
  if (existing && existing.updatedAt >= at) return false;
  await db().chapterProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, page, pageCount, updatedAt: at },
    update: { page, pageCount, updatedAt: at },
  });
  return true;
}

/**
 * Merges browser-saved progress into the account (on sign-in, and for "mark season watched").
 * One statement per table whatever the size: unknown ids drop out on the join, and an existing row
 * is only overwritten by a newer entry. (Per-row queries made sign-in hang; a 1000-upsert transaction timed out.)
 */
export async function importProgress(userId: string, state: ProgressState) {
  const now = Date.now();
  const eps = Object.entries(state.episodes).slice(0, 2000);
  const chs = Object.entries(state.chapters).slice(0, 2000);
  const at = (t: number) => Math.min(t, now); // client clocks can run ahead

  const [episodes, chapters] = await Promise.all([
    eps.length === 0
      ? 0
      : db().$executeRaw`
          INSERT INTO "EpisodeProgress" ("userId", "episodeId", "progress", "updatedAt")
          SELECT ${userId}, t.id, t.progress, to_timestamp(t.at / 1000.0) AT TIME ZONE 'UTC'
          FROM unnest(${eps.map(([id]) => id)}::text[], ${eps.map(([, e]) => e.progress)}::float8[], ${eps.map(([, e]) => at(e.updatedAt))}::float8[]) AS t(id, progress, at)
          JOIN "Episode" ON "Episode".id = t.id
          ON CONFLICT ("userId", "episodeId") DO UPDATE SET "progress" = EXCLUDED."progress", "updatedAt" = EXCLUDED."updatedAt"
          WHERE "EpisodeProgress"."updatedAt" < EXCLUDED."updatedAt"`,
    chs.length === 0
      ? 0
      : db().$executeRaw`
          INSERT INTO "ChapterProgress" ("userId", "chapterId", "page", "pageCount", "updatedAt")
          SELECT ${userId}, t.id, LEAST(t.page, t.page_count), t.page_count, to_timestamp(t.at / 1000.0) AT TIME ZONE 'UTC'
          FROM unnest(${chs.map(([id]) => id)}::text[], ${chs.map(([, c]) => c.page)}::int[], ${chs.map(([, c]) => c.pageCount)}::int[], ${chs.map(([, c]) => at(c.updatedAt))}::float8[]) AS t(id, page, page_count, at)
          JOIN "Chapter" ON "Chapter".id = t.id
          ON CONFLICT ("userId", "chapterId") DO UPDATE SET "page" = EXCLUDED."page", "pageCount" = EXCLUDED."pageCount", "updatedAt" = EXCLUDED."updatedAt"
          WHERE "ChapterProgress"."updatedAt" < EXCLUDED."updatedAt"`,
  ]);
  return episodes + chapters;
}

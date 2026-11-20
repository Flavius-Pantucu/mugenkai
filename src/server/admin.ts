import { db } from "./db";
import type { JobName } from "./sync/jobs";

/** Everything the admin console shows, read in one round of parallel queries. */
export async function getAdminData(meId: string) {
  const [jobs, counts, mangaWithoutChapters, animeWithoutLinks, airing, users] = await Promise.all([
    db().syncState.findMany(),
    Promise.all([
      db().series.count({ where: { kind: "ANIME" } }),
      db().season.count(),
      db().episode.count(),
      db().series.count({ where: { kind: "MANGA" } }),
      db().chapter.count(),
      db().streamingLink.count(),
    ]),
    db().series.findMany({
      where: { kind: "MANGA", chapters: { none: {} } },
      orderBy: { popularity: "desc" },
      select: { id: true, title: true, year: true },
    }),
    db().series.findMany({
      where: { kind: "ANIME", links: { none: {} }, episodes: { none: { links: { some: {} } } } },
      orderBy: { popularity: "desc" },
      select: { id: true, title: true, year: true },
    }),
    db().season.findMany({
      where: { airing: true },
      orderBy: { series: { popularity: "desc" } },
      select: { id: true, number: true, title: true, episodeCount: true, series: { select: { id: true, title: true } } },
    }),
    db().user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        sessions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        _count: { select: { list: true, episodeProgress: true, chapterProgress: true, comments: true } },
      },
    }),
  ]);

  const [anime, seasons, episodes, manga, chapters, links] = counts;
  return {
    meId,
    now: new Date().toISOString(),
    jobs: jobs.map((j) => ({
      job: j.job as JobName,
      lastRunAt: j.lastRunAt?.toISOString() ?? null,
      lastOkAt: j.lastOkAt?.toISOString() ?? null,
      lastError: j.lastError,
      summary: (j.summary ?? null) as Record<string, unknown> | null,
    })),
    counts: { anime, seasons, episodes, manga, chapters, links },
    gaps: { mangaWithoutChapters, animeWithoutLinks, airing },
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      lastSignIn: u.sessions[0]?.createdAt.toISOString() ?? null,
      list: u._count.list,
      progress: u._count.episodeProgress + u._count.chapterProgress,
      comments: u._count.comments,
    })),
  };
}

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;

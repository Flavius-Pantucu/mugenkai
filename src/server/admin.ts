import { unstable_cache } from "next/cache";
import { db } from "./db";
import { getRecentSecurityEvents } from "./http";
import { getSiteConfig } from "./site-config";
import type { JobName } from "./sync/jobs";

const TOTAL_QUERY = `query ($type: MediaType) {
  Page(page: 1, perPage: 1) { pageInfo { total } media(type: $type, isAdult: false) { id } }
}`;

const getAnilistTotals = unstable_cache(
  async (): Promise<{ anime: number | null; manga: number | null }> => {
    const fetchTotal = async (type: "ANIME" | "MANGA") => {
      try {
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: TOTAL_QUERY, variables: { type } }),
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data?: { Page?: { pageInfo?: { total?: number } } } };
        return json.data?.Page?.pageInfo?.total ?? null;
      } catch {
        return null;
      }
    };
    const [anime, manga] = await Promise.all([fetchTotal("ANIME"), fetchTotal("MANGA")]);
    return { anime, manga };
  },
  ["anilist-totals"],
  { revalidate: 6 * 3600 },
);

/** Everything the admin console shows, read in one round of parallel queries. */
export async function getAdminData(meId: string) {
  const [
    siteConfig,
    jobs,
    counts,
    mangaWithoutChapters,
    animeWithoutLinks,
    airing,
    series,
    users,
    recentComments,
    openReports,
    dbSecurityEvents,
    anilistTotals,
  ] = await Promise.all([
    getSiteConfig(),
    db().syncState.findMany(),
    Promise.all([
      db().series.count({ where: { kind: "ANIME" } }),
      db().season.count(),
      db().episode.count(),
      db().series.count({ where: { kind: "MANGA" } }),
      db().chapter.count(),
      db().streamingLink.count(),
      db().searchEntry.count(),
      db().searchEntry.count({ where: { kind: "ANIME" } }),
      db().searchEntry.count({ where: { kind: "MANGA" } }),
      db().comment.count({ where: { deletedAt: null } }),
      db().commentReport.count({ where: { status: "OPEN" } }),
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
    db().series.findMany({
      orderBy: { popularity: "desc" },
      take: 250,
      select: {
        id: true,
        kind: true,
        malId: true,
        mangadexId: true,
        title: true,
        nativeTitle: true,
        description: true,
        coverImage: true,
        bannerImage: true,
        color: true,
        status: true,
        rating: true,
        popularity: true,
        year: true,
        genres: true,
        studio: true,
        episodeDuration: true,
        trailerYoutubeId: true,
        author: true,
        volumeCount: true,
        chapterTotal: true,
        syncedAt: true,
        _count: { select: { seasons: true, episodes: true, chapters: true, links: true } },
      },
    }),
    db().user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        matureContent: true,
        notifications: true,
        bannedAt: true,
        banReason: true,
        mutedUntil: true,
        createdAt: true,
        sessions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        _count: { select: { list: true, episodeProgress: true, chapterProgress: true, comments: true, sessions: true } },
      },
    }),
    db().comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        threadId: true,
        body: true,
        spoiler: true,
        createdAt: true,
        deletedAt: true,
        user: { select: { id: true, username: true } },
        _count: { select: { likes: true, reports: true } },
      },
    }),
    db().commentReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        commentId: true,
        reason: true,
        status: true,
        createdAt: true,
        comment: {
          select: {
            id: true,
            threadId: true,
            body: true,
            deletedAt: true,
            user: { select: { id: true, username: true } },
          },
        },
      },
    }),
    db().securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    getAnilistTotals(),
  ]);

  const [anime, seasons, episodes, manga, chapters, links, searchEntries, searchAnimeEntries, searchMangaEntries, activeComments, openReportCount] = counts;

  const memoryEvents = getRecentSecurityEvents().map((e, idx) => ({
    id: `mem-${idx}-${e.createdAt}`,
    type: e.type,
    ip: e.ip,
    path: e.path,
    detail: e.detail ?? null,
    createdAt: e.createdAt,
  }));

  const dbEvents = dbSecurityEvents.map((e) => ({
    id: e.id,
    type: e.type,
    ip: e.ip,
    path: e.path,
    detail: e.detail,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    meId,
    now: new Date().toISOString(),
    siteConfig,
    jobs: jobs.map((j) => ({
      job: j.job as JobName,
      lastRunAt: j.lastRunAt?.toISOString() ?? null,
      lastOkAt: j.lastOkAt?.toISOString() ?? null,
      lastError: j.lastError,
      summary: (j.summary ?? null) as Record<string, unknown> | null,
    })),
    counts: {
      anime,
      seasons,
      episodes,
      manga,
      chapters,
      links,
      searchEntries,
      searchAnimeEntries,
      searchMangaEntries,
      anilistAnimeTotal: anilistTotals.anime,
      anilistMangaTotal: anilistTotals.manga,
      activeComments,
      openReportCount,
    },
    gaps: { mangaWithoutChapters, animeWithoutLinks, airing },
    series: series.map((s) => ({
      ...s,
      syncedAt: s.syncedAt.toISOString(),
      seasonsCount: s._count.seasons,
      episodesCount: s._count.episodes,
      chaptersCount: s._count.chapters,
      linksCount: s._count.links,
    })),
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      bio: u.bio,
      matureContent: u.matureContent,
      notifications: u.notifications,
      bannedAt: u.bannedAt?.toISOString() ?? null,
      banReason: u.banReason,
      mutedUntil: u.mutedUntil?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      lastSignIn: u.sessions[0]?.createdAt.toISOString() ?? null,
      activeSessions: u._count.sessions,
      list: u._count.list,
      progress: u._count.episodeProgress + u._count.chapterProgress,
      comments: u._count.comments,
    })),
    comments: recentComments.map((c) => ({
      id: c.id,
      threadId: c.threadId,
      body: c.body,
      spoiler: c.spoiler,
      createdAt: c.createdAt.toISOString(),
      deletedAt: c.deletedAt?.toISOString() ?? null,
      authorId: c.user.id,
      authorName: c.user.username,
      likes: c._count.likes,
      reports: c._count.reports,
    })),
    reports: openReports.map((r) => ({
      id: r.id,
      commentId: r.commentId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      threadId: r.comment.threadId,
      commentBody: r.comment.body,
      commentDeleted: r.comment.deletedAt !== null,
      authorId: r.comment.user.id,
      authorName: r.comment.user.username,
    })),
    securityEvents: dbEvents.length > 0 ? dbEvents : memoryEvents,
  };
}

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;

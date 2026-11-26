import { getCatalog } from "./catalog";
import { db } from "./db";
import { getWeekSchedule } from "./schedule";

const ANILIST_UPDATES_QUERY = `query ($ids: [Int]) {
  Page(perPage: 25) {
    media(id_in: $ids) {
      id
      status
      episodes
      chapters
      siteUrl
      nextAiringEpisode { episode airingAt }
    }
  }
}`;

export interface SavedNewsItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  kind: "ANIME" | "MANGA";
  coverImage: string;
  badge: string;
  headline: string;
  subtext: string;
  timestamp: string | null;
  href: string;
}

async function fetchLiveAnilistUpdates(ids: number[]) {
  if (ids.length === 0) return new Map<string, { status: string | null; episodes: number | null; chapters: number | null; nextEp: number | null; airingAt: number | null }>();
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANILIST_UPDATES_QUERY, variables: { ids: ids.slice(0, 25) } }),
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return new Map();
    const json = (await res.json()) as {
      data?: {
        Page?: {
          media?: {
            id: number;
            status: string | null;
            episodes: number | null;
            chapters: number | null;
            nextAiringEpisode: { episode: number; airingAt: number } | null;
          }[];
        };
      };
    };
    const map = new Map<string, { status: string | null; episodes: number | null; chapters: number | null; nextEp: number | null; airingAt: number | null }>();
    for (const m of json.data?.Page?.media ?? []) {
      map.set(String(m.id), {
        status: m.status,
        episodes: m.episodes,
        chapters: m.chapters,
        nextEp: m.nextAiringEpisode?.episode ?? null,
        airingAt: m.nextAiringEpisode?.airingAt ?? null,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function getMyListData(userId: string) {
  const [entries, epProgress, chProgress, catalog] = await Promise.all([
    db().listEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        series: {
          include: {
            seasons: { select: { episodeCount: true } },
            _count: { select: { episodes: true, chapters: true } },
          },
        },
      },
    }),
    db().episodeProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { episode: { select: { seriesId: true, number: true, seasonNumber: true } } },
    }),
    db().chapterProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { chapter: { select: { seriesId: true, number: true } } },
    }),
    getCatalog(),
  ]);

  const savedIds = entries.map((e) => e.seriesId);
  const numericIds = savedIds.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0);

  const [schedule, recentEpisodes, recentChapters, liveUpdates] = await Promise.all([
    getWeekSchedule(catalog),
    savedIds.length > 0
      ? db().episode.findMany({
          where: { seriesId: { in: savedIds }, airedAt: { not: null } },
          orderBy: { airedAt: "desc" },
          take: 15,
          include: { series: { select: { title: true, coverImage: true } } },
        })
      : Promise.resolve([]),
    savedIds.length > 0
      ? db().chapter.findMany({
          where: { seriesId: { in: savedIds }, publishedAt: { not: null } },
          orderBy: { publishedAt: "desc" },
          take: 15,
          include: { series: { select: { title: true, coverImage: true } } },
        })
      : Promise.resolve([]),
    fetchLiveAnilistUpdates(numericIds),
  ]);

  const latestEpBySeries = new Map<string, { label: string; count: number }>();
  for (const p of epProgress) {
    const prev = latestEpBySeries.get(p.episode.seriesId);
    if (!prev) {
      latestEpBySeries.set(p.episode.seriesId, { label: `S${p.episode.seasonNumber} E${p.episode.number}`, count: 1 });
    } else {
      prev.count += 1;
    }
  }

  const latestChBySeries = new Map<string, { label: string; count: number }>();
  for (const p of chProgress) {
    const prev = latestChBySeries.get(p.chapter.seriesId);
    if (!prev) {
      latestChBySeries.set(p.chapter.seriesId, { label: `Ch. ${p.chapter.number}`, count: 1 });
    } else {
      prev.count += 1;
    }
  }

  const savedSet = new Set(savedIds);
  const news: SavedNewsItem[] = [];

  for (const s of schedule) {
    const sid = s.seriesId ?? String(s.mediaId);
    if (!savedSet.has(sid)) continue;
    const airDate = new Date(s.airingAt * 1000);
    news.push({
      id: `air-${sid}-${s.episode}`,
      seriesId: sid,
      seriesTitle: s.title,
      kind: "ANIME",
      coverImage: s.cover,
      badge: "Airing Soon",
      headline: `Episode ${s.episode} airs ${airDate.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}`,
      subtext: `Scheduled at ${airDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`,
      timestamp: airDate.toISOString(),
      href: `/anime/${sid}`,
    });
  }

  for (const [seriesId, info] of liveUpdates) {
    if (!info.nextEp || !info.airingAt) continue;
    const entry = entries.find((e) => e.seriesId === seriesId);
    if (!entry) continue;
    const alreadyInSchedule = news.some((n) => n.seriesId === seriesId && n.badge === "Airing Soon");
    if (alreadyInSchedule) continue;
    news.push({
      id: `al-air-${seriesId}-${info.nextEp}`,
      seriesId,
      seriesTitle: entry.series.title,
      kind: entry.series.kind,
      coverImage: entry.series.coverImage,
      badge: "Next Episode",
      headline: `Episode ${info.nextEp} airing`,
      subtext: `Status: ${info.status ?? entry.series.status}`,
      timestamp: new Date(info.airingAt * 1000).toISOString(),
      href: `/${entry.series.kind.toLowerCase()}/${seriesId}`,
    });
  }

  for (const ep of recentEpisodes) {
    news.push({
      id: `ep-${ep.id}`,
      seriesId: ep.seriesId,
      seriesTitle: ep.series.title,
      kind: "ANIME",
      coverImage: ep.series.coverImage,
      badge: "New Episode",
      headline: `S${ep.seasonNumber} E${ep.number} — ${ep.title}`,
      subtext: "Available to watch",
      timestamp: ep.airedAt?.toISOString() ?? null,
      href: `/anime/${ep.seriesId}`,
    });
  }

  for (const ch of recentChapters) {
    news.push({
      id: `ch-${ch.id}`,
      seriesId: ch.seriesId,
      seriesTitle: ch.series.title,
      kind: "MANGA",
      coverImage: ch.series.coverImage,
      badge: "New Chapter",
      headline: `Chapter ${ch.number}${ch.title && ch.title !== `Chapter ${ch.number}` ? ` — ${ch.title}` : ""}`,
      subtext: ch.scanlationGroup ? `By ${ch.scanlationGroup}` : "Available to read",
      timestamp: ch.publishedAt?.toISOString() ?? null,
      href: `/manga/${ch.seriesId}`,
    });
  }

  news.sort((a, b) => (Date.parse(b.timestamp ?? "") || 0) - (Date.parse(a.timestamp ?? "") || 0));

  return {
    items: entries.map((e) => {
      const total =
        e.series.kind === "ANIME"
          ? e.series.seasons.reduce((sum, s) => sum + s.episodeCount, 0) || e.series._count.episodes
          : e.series.chapterTotal ?? e.series._count.chapters;
      const prog = e.series.kind === "ANIME" ? latestEpBySeries.get(e.seriesId) : latestChBySeries.get(e.seriesId);
      const live = liveUpdates.get(e.seriesId);
      return {
        seriesId: e.seriesId,
        kind: e.series.kind,
        title: e.series.title,
        coverImage: e.series.coverImage,
        year: e.series.year,
        seriesStatus: e.series.status,
        rating: e.series.rating,
        listStatus: e.status,
        score: e.score,
        updatedAt: e.updatedAt.toISOString(),
        totalCount: total,
        progressLabel: prog?.label ?? null,
        progressCount: prog?.count ?? 0,
        nextAiringEp: live?.nextEp ?? null,
      };
    }),
    news: news.slice(0, 30),
  };
}

export type MyListData = Awaited<ReturnType<typeof getMyListData>>;

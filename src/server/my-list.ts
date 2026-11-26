import { getCatalog } from "./catalog";
import { db } from "./db";
import { getWeekSchedule } from "./schedule";
import { fetchMangaChaptersWithFallback } from "./sync/manga-providers";

const ANILIST_UPDATES_QUERY = `query ($ids: [Int]) {
  Page(perPage: 25) {
    media(id_in: $ids) {
      id
      status
      episodes
      chapters
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
  badge: "Airing Soon" | "Next Episode" | "New Episode" | "New Chapter" | "Publishing";
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

function formatAiringRelative(airingAtSec: number, nowMs: number) {
  const diffMin = Math.round((airingAtSec * 1000 - nowMs) / 60_000);
  if (diffMin < 60) return `in ${Math.max(1, diffMin)} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `in ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `in ${diffD}d`;
}

export async function getMyListData(userId: string) {
  const now = new Date();
  const nowMs = now.getTime();

  const [entries, epProgress, chProgress, catalog] = await Promise.all([
    db().listEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        series: {
          include: {
            seasons: { select: { episodeCount: true } },
            episodes: { orderBy: [{ seasonNumber: "asc" }, { number: "asc" }], take: 1, select: { id: true } },
            chapters: { orderBy: { number: "asc" }, take: 1, select: { id: true } },
            _count: { select: { episodes: true, chapters: true } },
          },
        },
      },
    }),
    db().episodeProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { episode: { select: { id: true, seriesId: true, number: true, seasonNumber: true } } },
    }),
    db().chapterProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { chapter: { select: { id: true, seriesId: true, number: true } } },
    }),
    getCatalog(),
  ]);

  const savedIds = entries.map((e) => e.seriesId);
  const numericIds = savedIds.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0);

  const [schedule, recentEpisodes, recentChapters, liveUpdates] = await Promise.all([
    getWeekSchedule(catalog),
    savedIds.length > 0
      ? db().episode.findMany({
          where: { seriesId: { in: savedIds }, airedAt: { not: null, lte: now } },
          orderBy: { airedAt: "desc" },
          take: 15,
          include: { series: { select: { title: true, coverImage: true } } },
        })
      : Promise.resolve([]),
    savedIds.length > 0
      ? db().chapter.findMany({
          where: { seriesId: { in: savedIds }, publishedAt: { not: null, lte: now } },
          orderBy: { publishedAt: "desc" },
          take: 15,
          include: { series: { select: { title: true, coverImage: true } } },
        })
      : Promise.resolve([]),
    fetchLiveAnilistUpdates(numericIds),
  ]);

  const latestEpBySeries = new Map<string, { id: string; label: string; count: number }>();
  for (const p of epProgress) {
    const prev = latestEpBySeries.get(p.episode.seriesId);
    if (!prev) {
      latestEpBySeries.set(p.episode.seriesId, { id: p.episode.id, label: `S${p.episode.seasonNumber} E${p.episode.number}`, count: 1 });
    } else {
      prev.count += 1;
    }
  }

  const latestChBySeries = new Map<string, { id: string; label: string; count: number }>();
  for (const p of chProgress) {
    const prev = latestChBySeries.get(p.chapter.seriesId);
    if (!prev) {
      latestChBySeries.set(p.chapter.seriesId, { id: p.chapter.id, label: `Ch. ${p.chapter.number}`, count: 1 });
    } else {
      prev.count += 1;
    }
  }

  const savedSet = new Set(savedIds);
  const news: SavedNewsItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Upcoming airing episodes from schedule (strictly in the future)
  for (const s of schedule) {
    const sid = s.seriesId ?? String(s.mediaId);
    if (!savedSet.has(sid) || s.airingAt * 1000 <= nowMs) continue;
    const key = `ep:${sid}:${s.episode}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const airDate = new Date(s.airingAt * 1000);
    news.push({
      id: `air-${sid}-${s.episode}`,
      seriesId: sid,
      seriesTitle: s.title,
      kind: "ANIME",
      coverImage: s.cover,
      badge: "Airing Soon",
      headline: `Episode ${s.episode} airs ${formatAiringRelative(s.airingAt, nowMs)}`,
      subtext: `${airDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · ${airDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`,
      timestamp: airDate.toISOString(),
      href: `/anime/${sid}`,
    });
  }

  // 2. Live AniList nextAiringEpisode fallback (strictly in the future, deduplicated)
  for (const [seriesId, info] of liveUpdates) {
    if (!info.nextEp || !info.airingAt || info.airingAt * 1000 <= nowMs) continue;
    const key = `ep:${seriesId}:${info.nextEp}`;
    if (seenKeys.has(key)) continue;
    const entry = entries.find((e) => e.seriesId === seriesId);
    if (!entry) continue;
    seenKeys.add(key);

    const airDate = new Date(info.airingAt * 1000);
    news.push({
      id: `al-air-${seriesId}-${info.nextEp}`,
      seriesId,
      seriesTitle: entry.series.title,
      kind: entry.series.kind,
      coverImage: entry.series.coverImage,
      badge: "Next Episode",
      headline: `Episode ${info.nextEp} airs ${formatAiringRelative(info.airingAt, nowMs)}`,
      subtext: `${airDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · ${info.status ?? entry.series.status}`,
      timestamp: airDate.toISOString(),
      href: `/${entry.series.kind.toLowerCase()}/${seriesId}`,
    });
  }

  // 3. Recently aired episodes (strictly airedAt <= now, not already in upcoming)
  for (const ep of recentEpisodes) {
    const key = `ep:${ep.seriesId}:${ep.number}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    news.push({
      id: `ep-${ep.id}`,
      seriesId: ep.seriesId,
      seriesTitle: ep.series.title,
      kind: "ANIME",
      coverImage: ep.series.coverImage,
      badge: "New Episode",
      headline: `S${ep.seasonNumber} E${ep.number} — ${ep.title}`,
      subtext: "Available to watch now",
      timestamp: ep.airedAt?.toISOString() ?? null,
      href: `/watch/${ep.seriesId}/${ep.id}`,
    });
  }

  // 4. Recently published chapters (strictly publishedAt <= now)
  for (const ch of recentChapters) {
    const key = `ch:${ch.seriesId}:${ch.number}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    news.push({
      id: `ch-${ch.id}`,
      seriesId: ch.seriesId,
      seriesTitle: ch.series.title,
      kind: "MANGA",
      coverImage: ch.series.coverImage,
      badge: "New Chapter",
      headline: `Chapter ${ch.number}${ch.title && ch.title !== `Chapter ${ch.number}` ? ` — ${ch.title}` : ""}`,
      subtext: ch.scanlationGroup ? `By ${ch.scanlationGroup}` : "Available to read now",
      timestamp: ch.publishedAt?.toISOString() ?? null,
      href: `/read/${ch.seriesId}/${ch.id}`,
    });
  }

  // 5. Live chapter fallback for saved manga that have 0 chapters stored in DB (e.g. searched/non-curated manga like Boruto)
  const mangaNeedingLiveNews = entries
    .filter((e) => e.series.kind === "MANGA" && e.series._count.chapters === 0)
    .slice(0, 6);

  if (mangaNeedingLiveNews.length > 0) {
    const liveMangaResults = await Promise.all(
      mangaNeedingLiveNews.map(async (e) => {
        try {
          const chs = await Promise.race([
            fetchMangaChaptersWithFallback(e.series.title, e.seriesId, e.seriesId, e.series.nativeTitle),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
          ]);
          return { entry: e, latest: chs.at(-1) ?? null };
        } catch {
          return { entry: e, latest: null };
        }
      }),
    );

    for (const { entry, latest } of liveMangaResults) {
      if (latest) {
        const key = `ch:${entry.seriesId}:${latest.chapterNumber}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        news.push({
          id: `live-ch-${entry.seriesId}-${latest.chapterNumber}`,
          seriesId: entry.seriesId,
          seriesTitle: entry.series.title,
          kind: "MANGA",
          coverImage: entry.series.coverImage,
          badge: "New Chapter",
          headline: `Chapter ${latest.chapterNumber}${latest.title && latest.title !== `Chapter ${latest.chapterNumber}` ? ` — ${latest.title}` : ""}`,
          subtext: latest.scanlationGroup ? `Latest on ${latest.scanlationGroup}` : "Available to read now",
          timestamp: latest.releasedAt ?? entry.updatedAt.toISOString(),
          href: `/read/${entry.seriesId}/${latest.id}`,
        });
      } else if (entry.series.status === "ONGOING") {
        const live = liveUpdates.get(entry.seriesId);
        news.push({
          id: `pub-${entry.seriesId}`,
          seriesId: entry.seriesId,
          seriesTitle: entry.series.title,
          kind: "MANGA",
          coverImage: entry.series.coverImage,
          badge: "Publishing",
          headline: live?.chapters ? `${live.chapters} chapters published` : "Ongoing serialization",
          subtext: "View manga details",
          timestamp: entry.updatedAt.toISOString(),
          href: `/manga/${entry.seriesId}`,
        });
      }
    }
  }

  // Upcoming airing soonest first, then recent releases newest first
  news.sort((a, b) => {
    const aUp = a.badge === "Airing Soon" || a.badge === "Next Episode";
    const bUp = b.badge === "Airing Soon" || b.badge === "Next Episode";
    if (aUp !== bUp) return aUp ? -1 : 1;
    const ta = Date.parse(a.timestamp ?? "") || 0;
    const tb = Date.parse(b.timestamp ?? "") || 0;
    return aUp ? ta - tb : tb - ta;
  });

  const scored = entries.map((e) => e.score).filter((s): s is number => typeof s === "number");
  const meanScore = scored.length > 0 ? Number((scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1)) : null;

  return {
    stats: {
      total: entries.length,
      current: entries.filter((e) => e.status === "CURRENT").length,
      completed: entries.filter((e) => e.status === "COMPLETED").length,
      episodesWatched: epProgress.length,
      chaptersRead: chProgress.length,
      meanScore,
    },
    items: entries.map((e) => {
      const total =
        e.series.kind === "ANIME"
          ? e.series.seasons.reduce((sum, s) => sum + s.episodeCount, 0) || e.series._count.episodes
          : e.series.chapterTotal ?? e.series._count.chapters;
      const prog = e.series.kind === "ANIME" ? latestEpBySeries.get(e.seriesId) : latestChBySeries.get(e.seriesId);
      const live = liveUpdates.get(e.seriesId);
      const continueHref =
        e.series.kind === "ANIME"
          ? prog?.id
            ? `/watch/${e.seriesId}/${prog.id}`
            : e.series.episodes[0]?.id
              ? `/watch/${e.seriesId}/${e.series.episodes[0].id}`
              : `/anime/${e.seriesId}`
          : prog?.id
            ? `/read/${e.seriesId}/${prog.id}`
            : e.series.chapters[0]?.id
              ? `/read/${e.seriesId}/${e.series.chapters[0].id}`
              : `/manga/${e.seriesId}`;

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
        nextAiringEp: live?.nextEp && live.airingAt && live.airingAt * 1000 > nowMs ? live.nextEp : null,
        continueHref,
      };
    }),
    news: news.slice(0, 30),
  };
}

export type MyListData = Awaited<ReturnType<typeof getMyListData>>;

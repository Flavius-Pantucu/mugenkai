import { z } from "zod";
import { episodeId } from "@/data/series";
import { getCatalog, seasonToSeries } from "@/server/catalog";
import { db } from "@/server/db";
import { backendEnabled } from "@/server/env";
import { json, route } from "@/server/http";
import { getWeekSchedule } from "@/server/schedule";

// New episodes and chapters from the last 8 days for the given series (the viewer's list).
// The list lives in the browser too, so this takes ids instead of needing a session.

export interface Release {
  key: string;
  kind: "anime" | "manga";
  seriesId: string;
  title: string;
  cover: string;
  label: string; // "Episode 8" / "Chapter 121"
  href: string;
  at: number; // ms
}

const IdsSchema = z.array(z.string().regex(/^[\w-]{1,64}$/)).max(300);
const WINDOW = 8 * 86_400_000;

export const GET = route(async (req: Request) => {
  const parsed = IdsSchema.safeParse((new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean));
  if (!parsed.success || parsed.data.length === 0) return json({ releases: [] });
  const ids = new Set(parsed.data);
  const now = Date.now();

  const catalog = await getCatalog();
  const seasons = seasonToSeries(catalog);
  const releases: Release[] = [];

  for (const s of await getWeekSchedule(catalog)) {
    const at = s.airingAt * 1000;
    if (!s.seriesId || !ids.has(s.seriesId) || at > now) continue;
    const series = seasons.get(s.mediaId)!;
    const season = series.seasons.find((x) => Number(x.id) === s.mediaId)?.number ?? 1;
    releases.push({
      key: `ep-${s.id}`,
      kind: "anime",
      seriesId: series.id,
      title: series.title,
      cover: series.coverImage,
      label: `${series.seasons.length > 1 ? `Season ${season} · ` : ""}Episode ${s.episode}`,
      href: `/watch/${series.id}/${episodeId(series.id, season, s.episode)}`,
      at,
    });
  }

  if (backendEnabled) {
    const chapters = await db().chapter.findMany({
      where: { seriesId: { in: [...ids] }, publishedAt: { gte: new Date(now - WINDOW), lte: new Date(now) } },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { id: true, number: true, publishedAt: true, series: { select: { id: true, title: true, coverImage: true } } },
    });
    for (const c of chapters) {
      releases.push({
        key: `ch-${c.id}`,
        kind: "manga",
        seriesId: c.series.id,
        title: c.series.title,
        cover: c.series.coverImage,
        label: `Chapter ${c.number}`,
        href: `/read/${c.series.id}/${c.id}`,
        at: c.publishedAt!.getTime(),
      });
    }
  }

  releases.sort((a, b) => b.at - a.at);
  return json({ releases: releases.slice(0, 40) }, { headers: { "Cache-Control": "private, max-age=300" } });
});

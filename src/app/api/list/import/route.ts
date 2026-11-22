import { z } from "zod";
import type { ListStatus } from "@/data/schema";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { HttpError, json, rateLimit, readJson, route } from "@/server/http";
import { gql } from "@/server/sync/anilist";

// Imports a public AniList list into the signed-in user's list. MyAnimeList users can first
// import into AniList (Settings > Import Lists there), so one importer covers both.

const BodySchema = z.object({ username: z.string().trim().min(2).max(40).regex(/^[\w-]+$/, "Letters, numbers, _ and - only") });

const QUERY = `query ($user: String, $type: MediaType) {
  MediaListCollection(userName: $user, type: $type) {
    lists { entries { mediaId status score(format: POINT_10) } }
  }
}`;

type Entry = { mediaId: number; status: string; score: number };
const STATUS: Record<string, ListStatus> = {
  CURRENT: "CURRENT",
  REPEATING: "CURRENT",
  PLANNING: "PLANNING",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
  DROPPED: "DROPPED",
};

/** Body: { username }. Existing entries are overwritten; titles outside our catalog are skipped. */
export const POST = route(async (req: Request) => {
  const { username } = await readJson(req, BodySchema);
  const user = await requireUser();
  rateLimit(`import:${user.id}`, 3, 60_000);

  const entries: Entry[] = [];
  for (const type of ["ANIME", "MANGA"]) {
    try {
      const data = await gql<{ MediaListCollection: { lists: { entries: Entry[] }[] } }>(QUERY, { user: username, type });
      for (const l of data.MediaListCollection.lists) entries.push(...l.entries);
    } catch (err) {
      if (/not found|private|HTTP 404/i.test(String(err))) throw new HttpError(404, "anilist_user", "No public AniList list for that username");
      throw err;
    }
  }

  // AniList ids are ours too, except later anime seasons, which live under their series.
  const ids = [...new Set(entries.map((e) => String(e.mediaId)))];
  const [series, seasons] = await Promise.all([
    db().series.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    db().season.findMany({ where: { id: { in: ids } }, select: { id: true, seriesId: true } }),
  ]);
  const toSeries = new Map<string, string>(series.map((s) => [s.id, s.id]));
  for (const s of seasons) if (!toSeries.has(s.id)) toSeries.set(s.id, s.seriesId);

  // One row per series: the first season listed wins; a score from any season fills a gap.
  const rows = new Map<string, { status: ListStatus; score: number | null }>();
  let skipped = 0;
  for (const e of entries) {
    const seriesId = toSeries.get(String(e.mediaId));
    const status = STATUS[e.status];
    if (!seriesId || !status) {
      skipped++;
      continue;
    }
    const score = e.score >= 1 ? Math.min(10, Math.round(e.score)) : null;
    const cur = rows.get(seriesId);
    if (!cur) rows.set(seriesId, { status, score });
    else if (!cur.score && score) cur.score = score;
  }

  await db().$transaction(
    [...rows].map(([seriesId, r]) =>
      db().listEntry.upsert({
        where: { userId_seriesId: { userId: user.id, seriesId } },
        create: { userId: user.id, seriesId, ...r },
        update: r,
      }),
    ),
  );
  return json({ imported: rows.size, skipped });
});

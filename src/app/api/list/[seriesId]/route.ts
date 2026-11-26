import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { ListEntryInputSchema } from "@/data/schema";
import { assertSameOrigin, HttpError, json, readJson, route } from "@/server/http";
import { hasPrismaCode } from "@/server/prisma-errors";
import { cleanDescription, toStatus } from "@/server/sync/parse";

type Ctx = { params: Promise<{ seriesId: string }> };

const MEDIA_BY_ID = `query ($id: Int) {
  Media(id: $id) {
    id idMal type status episodes chapters volumes duration averageScore popularity
    seasonYear startDate { year }
    title { english romaji }
    description(asHtml: false)
    coverImage { extraLarge color }
    bannerImage
    genres
    trailer { id site }
    studios(isMain: true) { nodes { name } }
    staff(perPage: 2) { edges { role node { name { full } } } }
  }
}`;

/**
 * If a user saves a title discovered via global/live search (not yet in the curated Series table),
 * fetch its metadata from AniList and persist it so ListEntry's foreign key succeeds.
 */
async function ensureSeriesExists(seriesId: string): Promise<boolean> {
  const existing = await db().series.findUnique({ where: { id: seriesId }, select: { id: true } });
  if (existing) return true;
  if (!/^\d+$/.test(seriesId)) return false;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: MEDIA_BY_ID, variables: { id: Number(seriesId) } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: { Media?: any } };
    const m = json.data?.Media;
    if (!m) return false;

    const kind = m.type === "MANGA" ? "MANGA" : "ANIME";
    const title = m.title?.english || m.title?.romaji || `#${m.id}`;
    const cover = m.coverImage?.extraLarge || "";
    const banner = m.bannerImage || cover;
    const year = m.seasonYear || m.startDate?.year || new Date().getUTCFullYear();

    await db().series.upsert({
      where: { id: seriesId },
      create: {
        id: seriesId,
        kind,
        malId: m.idMal ?? null,
        title,
        nativeTitle: m.title?.romaji || title,
        description: cleanDescription(m.description),
        coverImage: cover,
        bannerImage: banner,
        color: m.coverImage?.color ?? null,
        status: toStatus(m.status),
        rating: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : 0,
        popularity: m.popularity ?? 0,
        year,
        genres: Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : ["Anime"],
        studio: kind === "ANIME" ? m.studios?.nodes?.[0]?.name ?? null : null,
        episodeDuration: kind === "ANIME" ? m.duration ?? 24 : null,
        trailerYoutubeId: kind === "ANIME" && m.trailer?.site === "youtube" ? m.trailer.id : null,
        author: kind === "MANGA" ? m.staff?.edges?.[0]?.node?.name?.full ?? null : null,
        volumeCount: kind === "MANGA" ? m.volumes ?? null : null,
        chapterTotal: kind === "MANGA" ? m.chapters ?? null : null,
      },
      update: {},
    });

    if (kind === "ANIME") {
      await db().season.upsert({
        where: { id: seriesId },
        create: {
          id: seriesId,
          seriesId,
          number: 1,
          title,
          year,
          episodeCount: m.episodes ?? 12,
          coverImage: cover,
          bannerImage: banner,
          airing: m.status === "RELEASING",
        },
        update: {},
      });
    }

    return true;
  } catch {
    return false;
  }
}

/** Add a title or change its status / score. Body: { status, score? } (status defaults to PLANNING). */
export const PUT = route(async (req: Request, ctx: Ctx) => {
  const { status, score } = await readJson(req, ListEntryInputSchema);
  const user = await requireUser();
  const { seriesId } = await ctx.params;

  const ok = await ensureSeriesExists(seriesId);
  if (!ok) throw new HttpError(404, "unknown_series");

  try {
    await db().listEntry.upsert({
      where: { userId_seriesId: { userId: user.id, seriesId } },
      create: { userId: user.id, seriesId, status, score },
      update: { status, score },
    });
  } catch (err) {
    if (hasPrismaCode(err, "P2003")) throw new HttpError(404, "unknown_series");
    throw err;
  }
  return json({ ok: true });
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { seriesId } = await ctx.params;
  await db().listEntry.deleteMany({ where: { userId: user.id, seriesId } });
  return json({ ok: true });
});

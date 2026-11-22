import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { kitsuEpisodes } from "./kitsu";
import { airedEpisodes, assignStreamingEpisodes, cleanDescription, toStatus } from "./parse";

// AniList GraphQL. Public, no key; ~90 req/min (sometimes lowered to 30). We batch with id_in
// and back off on 429, so a full catalog sync stays around a dozen requests.
const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id idMal format status episodes chapters volumes duration averageScore popularity
  seasonYear startDate { year }
  title { english romaji }
  description(asHtml: false)
  coverImage { extraLarge color }
  bannerImage
  genres
  trailer { id site }
  nextAiringEpisode { episode airingAt }
  studios(isMain: true) { nodes { name } }
  staff(perPage: 4) { edges { role node { name { full } } } }
  externalLinks { url site type language }
  streamingEpisodes { title thumbnail url site }
  relations { edges { relationType node { id format type } } }
`;

const TOP_QUERY = `query ($type: MediaType, $page: Int) {
  Page(page: $page, perPage: 50) { media(type: $type, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} } }
}`;
const BY_ID_QUERY = `query ($ids: [Int]) {
  Page(perPage: 50) { media(id_in: $ids) { ${MEDIA_FIELDS} } }
}`;

interface Media {
  id: number;
  idMal: number | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  duration: number | null;
  averageScore: number | null;
  popularity: number;
  seasonYear: number | null;
  startDate: { year: number | null };
  title: { english: string | null; romaji: string };
  description: string | null;
  coverImage: { extraLarge: string; color: string | null };
  bannerImage: string | null;
  genres: string[];
  trailer: { id: string; site: string } | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  studios: { nodes: { name: string }[] };
  staff: { edges: { role: string; node: { name: { full: string } } }[] };
  externalLinks: { url: string; site: string; type: string | null; language: string | null }[];
  streamingEpisodes: { title: string | null; thumbnail: string | null; url: string | null; site: string | null }[];
  relations: { edges: { relationType: string; node: { id: number; format: string | null; type: string } }[] };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function gql<T>(query: string, variables: Record<string, unknown>, attempt = 0): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 4) {
    await sleep((Number(res.headers.get("retry-after")) || 30) * 1000);
    return gql(query, variables, attempt + 1);
  }
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const body = (await res.json()) as { data: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(`AniList: ${body.errors[0].message}`);
  return body.data;
}

const pageOf = (data: { Page: { media: Media[] } }) => data.Page.media;

async function byIds(ids: number[]) {
  const out: Media[] = [];
  for (let i = 0; i < ids.length; i += 50) out.push(...pageOf(await gql(BY_ID_QUERY, { ids: ids.slice(i, i + 50) })));
  return out;
}

const isSequelOf = (formats: string[]) => (e: Media["relations"]["edges"][number]) =>
  (e.relationType === "PREQUEL" || e.relationType === "PARENT") && formats.includes(e.node.format ?? "");

// TV first; ONA covers streaming-first seasons (JoJo's Stone Ocean onward is ONA on AniList).
const nextSequelOf = (m: Media, format: string) =>
  m.relations.edges.find((e) => e.relationType === "SEQUEL" && e.node.type === "ANIME" && e.node.format === format)?.node.id;
const nextTvSequel = (m: Media) => nextSequelOf(m, "TV") ?? nextSequelOf(m, "ONA");

async function topMedia(type: "ANIME" | "MANGA", formats: string[], n: number) {
  const out: Media[] = [];
  for (let page = 1; out.length < n && page <= 10; page++) {
    for (const m of pageOf(await gql(TOP_QUERY, { type, page }))) {
      if (!formats.includes(m.format ?? "") || m.relations.edges.some(isSequelOf(formats))) continue;
      out.push(m);
      if (out.length === n) break;
    }
  }
  return out;
}

/** Follows TV sequel chains a hop at a time (one id_in request per hop). */
async function seasonChains(roots: Media[]) {
  const byId = new Map(roots.map((m) => [m.id, m]));
  let frontier = roots.map(nextTvSequel).filter((id): id is number => !!id && !byId.has(id));
  for (let hop = 0; frontier.length && hop < 15; hop++) {
    for (const m of await byIds(frontier)) byId.set(m.id, m);
    frontier = [...new Set(frontier.map((id) => byId.get(id)).filter((m): m is Media => !!m).map(nextTvSequel))].filter(
      (id): id is number => !!id && !byId.has(id),
    );
  }
  return roots.map((root) => {
    const chain: Media[] = [];
    for (let s: Media | undefined = root; s && s.status !== "NOT_YET_RELEASED" && chain.length < 40; s = byId.get(nextTvSequel(s) ?? -1)) chain.push(s);
    return chain;
  });
}

const baseSeries = (m: Media) => ({
  malId: m.idMal,
  title: m.title.english || m.title.romaji,
  nativeTitle: m.title.romaji,
  description: cleanDescription(m.description),
  coverImage: m.coverImage.extraLarge,
  bannerImage: m.bannerImage || m.coverImage.extraLarge,
  color: m.coverImage.color,
  rating: (m.averageScore ?? 70) / 10,
  popularity: m.popularity,
  year: m.seasonYear ?? m.startDate.year ?? 2000,
  genres: m.genres,
});

const streamingLinks = (m: Media) => m.externalLinks.filter((l) => l.type === "STREAMING");

// ─── Writers ─────────────────────────────────────────────────────────────────

/**
 * Upserts one anime franchise: series row, every season, episode rows, official links.
 * `full` (daily catalog) also fills titles AniList lacks from Kitsu and rewrites every episode;
 * the hourly airing pass only applies AniList's own titles, so it never wipes the Kitsu ones.
 */
async function writeAnime(chain: Media[], full: boolean) {
  const root = chain[0];
  const seriesId = String(root.id);
  const series = {
    ...baseSeries(root),
    kind: "ANIME" as const,
    status: toStatus(chain.at(-1)!.status),
    studio: root.studios.nodes[0]?.name ?? "Unknown",
    episodeDuration: root.duration ?? 24,
    trailerYoutubeId: root.trailer?.site === "youtube" ? root.trailer.id : null,
  };
  const counts = chain.map(airedEpisodes);
  const streaming = assignStreamingEpisodes(chain.map((s, i) => ({ episodeCount: counts[i], streamingEpisodes: s.streamingEpisodes })));
  // Kitsu only for seasons with gaps (missing titles or air dates), one season at a time to stay polite.
  // Dated seasons are skipped, so after the first fill the daily run stays inside Vercel's time limit.
  const dated = full
    ? await db().episode.groupBy({ by: ["seasonId"], where: { seasonId: { in: chain.map((s) => String(s.id)) }, airedAt: { not: null } }, _count: true })
    : [];
  const datedCount = new Map(dated.map((d) => [d.seasonId, d._count]));
  const kitsu: Awaited<ReturnType<typeof kitsuEpisodes>>[] = [];
  for (const [i, s] of chain.entries()) {
    const gaps = streaming[i].length < counts[i] || (datedCount.get(String(s.id)) ?? 0) < counts[i];
    kitsu.push(full && gaps ? await kitsuEpisodes(String(s.id), counts[i]) : new Map());
  }

  await db().$transaction(
    async (tx) => {
      await tx.series.upsert({ where: { id: seriesId }, create: { id: seriesId, ...series }, update: series });

      for (const [i, s] of chain.entries()) {
        const number = i + 1;
        const seasonId = String(s.id);
        const banner = s.bannerImage || root.bannerImage || s.coverImage.extraLarge;
        const season = {
          seriesId,
          number,
          title: s.title.english || s.title.romaji,
          year: s.seasonYear ?? s.startDate.year ?? series.year,
          episodeCount: counts[i],
          coverImage: s.coverImage.extraLarge,
          bannerImage: banner,
          airing: s.status === "RELEASING",
        };
        await tx.season.upsert({ where: { id: seasonId }, create: { id: seasonId, ...season }, update: season });

        const episodes: Prisma.EpisodeCreateManyInput[] = Array.from({ length: season.episodeCount }, (_, k) => ({
          id: `${seriesId}-s${number}-e${k + 1}`,
          seriesId,
          seasonId,
          seasonNumber: number,
          number: k + 1,
          title: `Episode ${k + 1}`,
          thumbnail: banner,
          duration: s.duration ?? series.episodeDuration,
        }));
        await tx.episode.createMany({ data: episodes, skipDuplicates: true });

        // Titles and thumbnails: AniList first, then Kitsu, then the placeholder. A full pass rewrites
        // every episode, so anything a past sync put on the wrong season is replaced.
        const fromAniList = new Map(streaming[i].map((se) => [se.number, se]));
        const rows = (full ? episodes.map((e) => e.number) : [...fromAniList.keys()]).map((n) => {
          const a = fromAniList.get(n);
          const k = kitsu[i].get(n);
          return {
            id: `${seriesId}-s${number}-e${n}`,
            title: a?.title ?? k?.title ?? `Episode ${n}`,
            thumbnail: a?.thumbnail ?? k?.thumbnail ?? (full ? banner : null),
            airedAt: k?.airedAt ?? null,
          };
        });
        if (rows.length > 0) {
          await tx.$executeRaw`
            UPDATE "Episode" AS e SET title = t.title, thumbnail = COALESCE(t.thumb, e.thumbnail), "airedAt" = COALESCE(t.aired, e."airedAt")
            FROM unnest(${rows.map((r) => r.id)}::text[], ${rows.map((r) => r.title)}::text[], ${rows.map((r) => r.thumbnail)}::text[], ${rows.map((r) => r.airedAt)}::timestamp[]) AS t(id, title, thumb, aired)
            WHERE e.id = t.id`;
        }

        // Per-episode official links where AniList has them.
        for (const se of streaming[i]) {
          const episodeId = `${seriesId}-s${number}-e${se.number}`;
          if (se.url && se.site) {
            await tx.streamingLink.upsert({
              where: { url: se.url },
              create: { url: se.url, provider: se.site, episodeId },
              update: { provider: se.site, episodeId },
            });
          }
        }
      }

      for (const l of streamingLinks(root)) {
        await tx.streamingLink.upsert({
          where: { url: l.url },
          create: { url: l.url, provider: l.site, language: l.language, seriesId },
          update: { provider: l.site, language: l.language, seriesId },
        });
      }
    },
    { timeout: 60_000 },
  );
  return chain.length;
}

async function writeManga(m: Media) {
  const id = String(m.id);
  const series = {
    ...baseSeries(m),
    kind: "MANGA" as const,
    status: toStatus(m.status),
    author: m.staff.edges.find((e) => /story/i.test(e.role))?.node.name.full ?? m.staff.edges[0]?.node.name.full ?? "Unknown",
    volumeCount: m.volumes,
    chapterTotal: m.chapters,
  };
  await db().series.upsert({ where: { id }, create: { id, ...series }, update: series });
  // Official English readers: where to send people for chapters MangaDex can't host.
  for (const l of streamingLinks(m).filter((l) => !l.language || l.language === "English")) {
    await db().streamingLink.upsert({
      where: { url: l.url },
      create: { url: l.url, provider: l.site, language: l.language, seriesId: id },
      update: { provider: l.site, language: l.language, seriesId: id },
    });
  }
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

/** Daily: the top-N anime (with all seasons) and top-N manga by popularity. */
export async function syncCatalog(topAnime: number, topManga: number) {
  const roots = await topMedia("ANIME", ["TV"], topAnime);
  // 4 franchises at a time: the Kitsu lookups dominate, and one by one this nears Vercel's 300 s limit.
  const chains = await seasonChains(roots);
  let seasons = 0;
  for (let i = 0; i < chains.length; i += 4)
    for (const n of await Promise.all(chains.slice(i, i + 4).map((c) => writeAnime(c, true)))) seasons += n;

  const manga = await topMedia("MANGA", ["MANGA"], topManga);
  for (const m of manga) await writeManga(m);

  return { anime: roots.length, seasons, manga: manga.length };
}

/** Hourly: re-reads only franchises with an airing season, adding new episodes and links as they appear. */
export async function syncAiring() {
  const airing = await db().season.findMany({ where: { airing: true }, select: { seriesId: true } });
  const seriesIds = [...new Set(airing.map((s) => s.seriesId))];
  if (seriesIds.length === 0) return { franchises: 0 };

  // Same path as the daily sync (idempotent), so new episodes, titles and links all land.
  const roots = await byIds(seriesIds.map(Number));
  for (const chain of await seasonChains(roots)) await writeAnime(chain, false);
  return { franchises: roots.length };
}

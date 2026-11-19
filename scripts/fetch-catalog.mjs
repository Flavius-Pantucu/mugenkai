// Regenerates src/data/catalog.json from AniList's public GraphQL API.
// Picks the 50 most popular anime and manga of all time, skipping sequels
// (a PREQUEL/PARENT of the same format) so each franchise shows up once.
// Usage: node scripts/fetch-catalog.mjs
import { writeFile } from "node:fs/promises";

const QUERY = `
query ($type: MediaType, $page: Int) {
  Page(page: $page, perPage: 50) {
    media(type: $type, sort: POPULARITY_DESC, isAdult: false) {
      id format status episodes chapters volumes duration averageScore popularity
      seasonYear startDate { year }
      title { english romaji }
      description(asHtml: false)
      coverImage { extraLarge color }
      bannerImage
      genres
      trailer { id site }
      nextAiringEpisode { episode }
      studios(isMain: true) { nodes { name } }
      staff(perPage: 4) { edges { role node { name { full } } } }
      relations { edges { relationType node { id format type } } }
    }
  }
}`;

// Sequel seasons, fetched a whole "hop" at a time (id_in) to stay well under AniList's rate limit.
const SEASON_QUERY = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id format status episodes seasonYear startDate { year }
      title { english romaji }
      coverImage { extraLarge }
      bannerImage
      nextAiringEpisode { episode }
      relations { edges { relationType node { id format type } } }
    }
  }
}`;

async function gql(query, variables) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList: HTTP ${res.status}`);
  return (await res.json()).data.Page.media;
}

const nextTvSequel = (m) =>
  m.relations.edges.find((e) => e.relationType === "SEQUEL" && e.node.type === "ANIME" && e.node.format === "TV")?.node.id;

/** Follow each show's TV sequel chain; returns id -> media for every season found. */
async function fetchSeasons(roots) {
  const byId = new Map(roots.map((m) => [m.id, m]));
  let frontier = roots.map(nextTvSequel).filter((id) => id && !byId.has(id));
  for (let hop = 0; frontier.length && hop < 12; hop++) {
    for (let i = 0; i < frontier.length; i += 50) {
      for (const m of await gql(SEASON_QUERY, { ids: frontier.slice(i, i + 50) })) byId.set(m.id, m);
    }
    frontier = [...new Set(frontier.map((id) => byId.get(id)).filter(Boolean).map(nextTvSequel))].filter((id) => id && !byId.has(id));
  }
  return byId;
}

const episodesOf = (m) => m.episodes ?? Math.max((m.nextAiringEpisode?.episode ?? 13) - 1, 12);

async function fetchPage(type, page) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { type, page } }),
  });
  if (!res.ok) throw new Error(`AniList ${type} page ${page}: HTTP ${res.status}`);
  return (await res.json()).data.Page.media;
}

const clean = (html) =>
  (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\(Source:[^)]*\)/gi, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

const status = (s) => (s === "RELEASING" || s === "HIATUS" ? "ONGOING" : "COMPLETED");

async function top(type, formats, n) {
  const out = [];
  for (let page = 1; out.length < n && page <= 6; page++) {
    for (const m of await fetchPage(type, page)) {
      if (!formats.includes(m.format)) continue;
      const isSequel = (e) => (e.relationType === "PREQUEL" || e.relationType === "PARENT") && formats.includes(e.node.format);
      if (m.relations.edges.some(isSequel)) continue;
      out.push(m);
      if (out.length === n) break;
    }
  }
  return out;
}

const base = (m) => ({
  id: String(m.id),
  title: m.title.english || m.title.romaji,
  nativeTitle: m.title.romaji,
  description: clean(m.description),
  coverImage: m.coverImage.extraLarge,
  bannerImage: m.bannerImage || m.coverImage.extraLarge,
  color: m.coverImage.color ?? null,
  status: status(m.status),
  rating: (m.averageScore ?? 70) / 10,
  popularity: m.popularity,
  year: m.seasonYear ?? m.startDate.year ?? 2000,
  genres: m.genres,
});

const animeRoots = await top("ANIME", ["TV"], 50);
const seasonsById = await fetchSeasons(animeRoots);

const anime = animeRoots.map((m) => {
  const chain = [];
  // Announced-but-unaired seasons have no episodes to list; the chain stops there.
  for (let s = m; s && s.status !== "NOT_YET_RELEASED" && chain.length < 30; s = seasonsById.get(nextTvSequel(s))) chain.push(s);
  const seasons = chain.map((s, i) => ({
    id: String(s.id),
    number: i + 1,
    title: s.title.english || s.title.romaji,
    year: s.seasonYear ?? s.startDate.year ?? 2000,
    episodeCount: episodesOf(s),
    coverImage: s.coverImage.extraLarge,
    bannerImage: s.bannerImage || m.bannerImage || s.coverImage.extraLarge,
  }));
  return {
    ...base(m),
    // The franchise is ongoing while its latest season is still airing.
    status: status(chain.at(-1).status ?? m.status),
    studio: m.studios.nodes[0]?.name ?? "Unknown",
    episodeCount: seasons.reduce((n, s) => n + s.episodeCount, 0),
    episodeDuration: m.duration ?? 24,
    trailerYoutubeId: m.trailer?.site === "youtube" ? m.trailer.id : null,
    seasons,
  };
});

const manga = (await top("MANGA", ["MANGA"], 50)).map((m) => ({
  ...base(m),
  author:
    m.staff.edges.find((e) => /story/i.test(e.role))?.node.name.full ??
    m.staff.edges[0]?.node.name.full ??
    "Unknown",
  // ponytail: ongoing series have no final count on AniList; 150 is a stand-in.
  chapterCount: m.chapters ?? 150,
  volumeCount: m.volumes ?? null,
}));

await writeFile(
  new URL("../src/data/catalog.json", import.meta.url),
  JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), anime, manga }, null, 2) + "\n",
);
console.log(`anime: ${anime.length}, manga: ${manga.length}`);

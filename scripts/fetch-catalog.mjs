// Regenerates src/data/catalog.json from AniList's public GraphQL API.
// Fetches top popular anime and manga, automatically skipping prequels/parent duplicates
// so each franchise shows up as a complete entry with all its seasons.
//
// Usage:
//   node scripts/fetch-catalog.mjs [animeCount] [mangaCount]
// Example:
//   node scripts/fetch-catalog.mjs 250 250
import { writeFile } from "node:fs/promises";

const targetAnime = parseInt(process.argv[2] || process.env.ANIME_COUNT || "250", 10);
const targetManga = parseInt(process.argv[3] || process.env.MANGA_COUNT || "250", 10);

console.log(`[Catalog] Starting fetch for ~${targetAnime} anime and ~${targetManga} manga franchises...`);

const QUERY = `
query ($type: MediaType, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    media(type: $type, sort: POPULARITY_DESC, isAdult: false) {
      id format status episodes chapters volumes duration averageScore popularity
      seasonYear startDate { year }
      title { english romaji }
      description(asHtml: false)
      coverImage { extraLarge large medium color }
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

const SEASON_QUERY = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id format status episodes seasonYear startDate { year }
      title { english romaji }
      coverImage { extraLarge large medium }
      bannerImage
      nextAiringEpisode { episode }
      relations { edges { relationType node { id format type } } }
    }
  }
}`;

async function gql(query, variables, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);
        console.warn(`[AniList] Rate limited (429). Waiting ${retryAfter + 1}s before retry...`);
        await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
        continue;
      }

      if (!res.ok) {
        if (attempt < retries && res.status >= 500) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`AniList: HTTP ${res.status}`);
      }

      const json = await res.json();
      // Polite pacing to stay comfortably under 90 req/min
      await new Promise((r) => setTimeout(r, 400));
      return json.data.Page.media;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[AniList] Network error on attempt ${attempt + 1}: ${err.message}. Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const nextTvSequel = (m) =>
  m.relations?.edges?.find(
    (e) =>
      e.relationType === "SEQUEL" &&
      e.node?.type === "ANIME" &&
      ["TV", "TV_SHORT", "ONA", "OVA"].includes(e.node?.format),
  )?.node?.id;

/** Follow each show's sequel chain; returns id -> media for every season found. */
async function fetchSeasons(roots) {
  const byId = new Map(roots.map((m) => [m.id, m]));
  let frontier = roots.map(nextTvSequel).filter((id) => id && !byId.has(id));

  for (let hop = 0; frontier.length && hop < 12; hop++) {
    console.log(`[Catalog] Fetching season sequel hop ${hop + 1} (${frontier.length} sequels)...`);
    for (let i = 0; i < frontier.length; i += 50) {
      const batch = frontier.slice(i, i + 50);
      const results = await gql(SEASON_QUERY, { ids: batch });
      for (const m of results) {
        byId.set(m.id, m);
      }
    }
    frontier = [...new Set(frontier.map((id) => byId.get(id)).filter(Boolean).map(nextTvSequel))].filter(
      (id) => id && !byId.has(id),
    );
  }
  return byId;
}

const episodesOf = (m) => Math.max(1, m.episodes ?? (m.nextAiringEpisode?.episode ? m.nextAiringEpisode.episode - 1 : 12));

const clean = (html) =>
  (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\(Source:[^)]*\)/gi, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

const status = (s) => (s === "RELEASING" || s === "HIATUS" ? "ONGOING" : "COMPLETED");

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1578632767115-351597cf2477";

async function top(type, formats, n) {
  const out = [];
  const seenIds = new Set();
  const maxPages = Math.ceil((n * 2.5) / 50) + 15;

  for (let page = 1; out.length < n && page <= maxPages; page++) {
    console.log(`[Catalog] Fetching ${type} page ${page} (${out.length}/${n} collected)...`);
    const pageItems = await gql(QUERY, { type, page });
    if (!pageItems || pageItems.length === 0) break;

    for (const m of pageItems) {
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);

      if (!formats.includes(m.format)) continue;

      // Skip sequels/prequels so only franchise roots are added
      const isSequel = (e) =>
        (e.relationType === "PREQUEL" || e.relationType === "PARENT") &&
        formats.includes(e.node?.format);
      if (m.relations?.edges?.some(isSequel)) continue;

      out.push(m);
      if (out.length === n) break;
    }
  }
  return out;
}

const base = (m) => {
  const cover = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || FALLBACK_IMAGE;
  const banner = m.bannerImage || cover;

  return {
    id: String(m.id),
    title: m.title?.english || m.title?.romaji || `Series ${m.id}`,
    nativeTitle: m.title?.romaji || m.title?.english || `Series ${m.id}`,
    description: clean(m.description) || "No description available.",
    coverImage: cover,
    bannerImage: banner,
    color: m.coverImage?.color ?? null,
    status: status(m.status),
    rating: Number(((m.averageScore ?? 70) / 10).toFixed(1)),
    popularity: m.popularity || 0,
    year: m.seasonYear ?? m.startDate?.year ?? 2020,
    genres: m.genres && m.genres.length > 0 ? m.genres : ["Animation"],
  };
};

// 1. Fetch Anime
console.log(`\n--- Fetching Top ${targetAnime} Anime ---`);
const animeRoots = await top("ANIME", ["TV", "TV_SHORT", "MOVIE", "ONA"], targetAnime);
console.log(`[Catalog] Found ${animeRoots.length} franchise roots. Resolving sequel seasons...`);
const seasonsById = await fetchSeasons(animeRoots);

const anime = animeRoots.map((m) => {
  const chain = [];
  for (
    let s = m;
    s && s.status !== "NOT_YET_RELEASED" && chain.length < 30;
    s = seasonsById.get(nextTvSequel(s))
  ) {
    chain.push(s);
  }

  const seasons = chain.map((s, i) => {
    const sCover = s.coverImage?.extraLarge || s.coverImage?.large || s.coverImage?.medium || FALLBACK_IMAGE;
    const sBanner = s.bannerImage || m.bannerImage || sCover;

    return {
      id: String(s.id),
      number: i + 1,
      title: s.title?.english || s.title?.romaji || `Season ${i + 1}`,
      year: s.seasonYear ?? s.startDate?.year ?? 2020,
      episodeCount: episodesOf(s),
      coverImage: sCover,
      bannerImage: sBanner,
    };
  });

  return {
    ...base(m),
    status: status(chain.at(-1)?.status ?? m.status),
    studio: m.studios?.nodes?.[0]?.name ?? "Unknown",
    episodeCount: seasons.reduce((n, s) => n + s.episodeCount, 0),
    episodeDuration: m.duration ?? 24,
    trailerYoutubeId: m.trailer?.site === "youtube" ? m.trailer.id : null,
    seasons,
  };
});

// 2. Fetch Manga
console.log(`\n--- Fetching Top ${targetManga} Manga ---`);
const mangaRoots = await top("MANGA", ["MANGA", "ONE_SHOT"], targetManga);
const manga = mangaRoots.map((m) => ({
  ...base(m),
  author:
    m.staff?.edges?.find((e) => /story|art/i.test(e.role))?.node?.name?.full ??
    m.staff?.edges?.[0]?.node?.name?.full ??
    "Unknown",
  chapterCount: Math.max(1, m.chapters ?? 150),
  volumeCount: m.volumes ?? null,
}));

console.log(`\n[Catalog] Writing ${anime.length} anime and ${manga.length} manga to src/data/catalog.json...`);
await writeFile(
  new URL("../src/data/catalog.json", import.meta.url),
  JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), anime, manga }, null, 2) + "\n",
);

console.log(`✓ Catalog updated successfully: ${anime.length} anime, ${manga.length} manga!`);

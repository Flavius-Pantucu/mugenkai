// Extra detail-page data straight from AniList: characters, recommendations and the
// anime <-> manga adaptation links. Cached by Next's fetch cache for a day; never stored.

export interface MediaRef {
  id: number;
  kind: "anime" | "manga";
  title: string;
  cover: string;
  format: string | null;
  rating: number | null;
}

export interface Character {
  name: string;
  image: string;
  imageLarge: string;
  role: string; // MAIN / SUPPORTING
  voiceActor: string | null;
}

export interface FranchiseSeason {
  id: string;
  number: number;
  title: string;
  year?: number;
  episodes?: number | null;
  cover?: string;
  format?: string | null;
}

export interface SeriesDetails {
  characters: Character[];
  recommendations: MediaRef[];
  /** Anime page: the manga it adapts. Manga page: its anime adaptations. */
  adaptations: MediaRef[];
  /** Anime franchise: all related seasons (prequels, current, sequels) */
  franchiseSeasons: FranchiseSeason[];
}

const QUERY = `query ($id: Int) {
  Media(id: $id) {
    id
    type
    format
    seasonYear
    episodes
    title { english romaji }
    coverImage { large }
    characters(sort: [ROLE, RELEVANCE], perPage: 12) {
      edges { role node { name { full } image { medium large } } voiceActors(language: JAPANESE) { name { full } } }
    }
    recommendations(sort: RATING_DESC, perPage: 15) {
      nodes { mediaRecommendation { ...ref } }
    }
    relations { edges { relationType node { ...ref } } }
  }
}
fragment ref on Media { id type format isAdult title { english romaji } coverImage { large } averageScore seasonYear episodes }`;

interface RawRef {
  id: number;
  type: "ANIME" | "MANGA";
  format: string | null;
  isAdult: boolean;
  title: { english: string | null; romaji: string };
  coverImage: { large: string };
  averageScore: number | null;
  seasonYear?: number | null;
  episodes?: number | null;
}

const toRef = (m: RawRef): MediaRef => ({
  id: m.id,
  kind: m.type === "ANIME" ? "anime" : "manga",
  title: m.title.english || m.title.romaji,
  cover: m.coverImage.large,
  format: m.format,
  rating: m.averageScore ? m.averageScore / 10 : null,
});

// Formats we can open: series pages exist for these only.
const OPENABLE = new Set(["TV", "ONA", "MOVIE", "OVA", "MANGA", "ONE_SHOT"]);

const franchiseCache = new Map<string, { seasons: FranchiseSeason[]; timestamp: number }>();
const FRANCHISE_CACHE_TTL = 24 * 60 * 60 * 1000;

export async function getFranchiseSeasons(id: string): Promise<FranchiseSeason[]> {
  if (!/^\d+$/.test(id)) return [];
  const cached = franchiseCache.get(id);
  if (cached && Date.now() - cached.timestamp < FRANCHISE_CACHE_TTL) {
    return cached.seasons;
  }

  try {
    const visited = new Map<number, { id: number; title: string; year: number; episodes: number | null; cover?: string; format?: string }>();
    let currentIds = [Number(id)];

    for (let hop = 0; hop < 5 && currentIds.length > 0; hop++) {
      const nextIds: number[] = [];
      for (const curId of currentIds) {
        if (visited.has(curId)) continue;
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: QUERY, variables: { id: curId } }),
          next: { revalidate: 86400 },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const m = data.data?.Media;
        if (!m || m.type !== "ANIME") continue;

        visited.set(curId, {
          id: m.id,
          title: m.title?.english || m.title?.romaji || `Season`,
          year: m.seasonYear || 0,
          episodes: m.episodes ?? null,
          cover: m.coverImage?.large,
          format: m.format,
        });

        for (const edge of m.relations?.edges || []) {
          if (edge.node?.type === "ANIME" && ["SEQUEL", "PREQUEL"].includes(edge.relationType)) {
            const nodeFormat = edge.node.format || "";
            if (!visited.has(edge.node.id) && ["TV", "ONA", "OVA", "MOVIE"].includes(nodeFormat)) {
              nextIds.push(edge.node.id);
            }
          }
        }
      }
      currentIds = [...new Set(nextIds)];
    }

    const all = Array.from(visited.values());
    if (all.length === 0) return [];

    all.sort((a, b) => (a.year || 0) - (b.year || 0) || a.id - b.id);
    const seasons: FranchiseSeason[] = all.map((m, idx) => ({
      id: String(m.id),
      number: idx + 1,
      title: m.title,
      year: m.year || undefined,
      episodes: m.episodes,
      cover: m.cover,
      format: m.format,
    }));

    // Cache for every season in this franchise
    for (const s of seasons) {
      franchiseCache.set(s.id, { seasons, timestamp: Date.now() });
    }

    return seasons;
  } catch (err) {
    console.warn(`[getFranchiseSeasons] ${id}:`, err);
    return [];
  }
}

export async function getSeriesDetails(id: string): Promise<SeriesDetails> {
  const empty = { characters: [], recommendations: [], adaptations: [], franchiseSeasons: [] };
  if (!/^\d+$/.test(id)) return empty; // demo catalog ids aren't AniList ids
  try {
    const [res, franchiseSeasons] = await Promise.all([
      fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: QUERY, variables: { id: Number(id) } }),
        next: { revalidate: 86400 },
      }),
      getFranchiseSeasons(id),
    ]);
    if (!res.ok) return { ...empty, franchiseSeasons };
    const m = (await res.json()).data?.Media;
    if (!m) return { ...empty, franchiseSeasons };

    const characters: Character[] = m.characters.edges.map(
      (e: { role: string; node: { name: { full: string }; image: { medium: string; large: string } }; voiceActors: { name: { full: string } }[] }) => ({
        name: e.node.name.full,
        image: e.node.image.medium,
        imageLarge: e.node.image.large,
        role: e.role,
        voiceActor: e.voiceActors[0]?.name.full ?? null,
      }),
    );
    const recommendations = (m.recommendations.nodes as { mediaRecommendation: RawRef | null }[])
      .map((n) => n.mediaRecommendation)
      .filter((r): r is RawRef => !!r && !r.isAdult && OPENABLE.has(r.format ?? ""))
      .map(toRef);
    const other = m.type === "ANIME" ? "MANGA" : "ANIME";
    const adaptations = (m.relations.edges as { relationType: string; node: RawRef }[])
      .filter((e) => (e.relationType === "SOURCE" || e.relationType === "ADAPTATION") && e.node.type === other && OPENABLE.has(e.node.format ?? ""))
      .map((e) => toRef(e.node));
    return { characters, recommendations, adaptations, franchiseSeasons };
  } catch (err) {
    console.warn(`[getSeriesDetails] ${id}:`, err);
    return empty;
  }
}

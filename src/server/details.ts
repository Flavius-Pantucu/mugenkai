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

export interface SeriesDetails {
  characters: Character[];
  recommendations: MediaRef[];
  /** Anime page: the manga it adapts. Manga page: its anime adaptations. */
  adaptations: MediaRef[];
}

const QUERY = `query ($id: Int) {
  Media(id: $id) {
    type
    characters(sort: [ROLE, RELEVANCE], perPage: 12) {
      edges { role node { name { full } image { medium large } } voiceActors(language: JAPANESE) { name { full } } }
    }
    recommendations(sort: RATING_DESC, perPage: 15) {
      nodes { mediaRecommendation { ...ref } }
    }
    relations { edges { relationType node { ...ref } } }
  }
}
fragment ref on Media { id type format isAdult title { english romaji } coverImage { large } averageScore }`;

interface RawRef {
  id: number;
  type: "ANIME" | "MANGA";
  format: string | null;
  isAdult: boolean;
  title: { english: string | null; romaji: string };
  coverImage: { large: string };
  averageScore: number | null;
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

export async function getSeriesDetails(id: string): Promise<SeriesDetails> {
  const empty = { characters: [], recommendations: [], adaptations: [] };
  if (!/^\d+$/.test(id)) return empty; // demo catalog ids aren't AniList ids
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { id: Number(id) } }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return empty;
    const m = (await res.json()).data?.Media;
    if (!m) return empty;

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
    return { characters, recommendations, adaptations };
  } catch (err) {
    console.warn(`[getSeriesDetails] ${id}:`, err);
    return empty;
  }
}

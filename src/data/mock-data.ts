import raw from "./catalog.json";
import {
  CatalogSchema,
  type Anime,
  type Chapter,
  type Episode,
  type Manga,
  type MangaPage,
  type Status,
  type UserProfile,
} from "./schema";

export type { Anime, Chapter, Episode, Manga, MangaPage, UserProfile } from "./schema";

// Real titles from AniList (scripts/fetch-catalog.mjs). Parsed once so a bad regenerate fails loudly.
const catalog = CatalogSchema.parse(raw);

const PAGES_PER_CHAPTER = 18;

export const animeList: Anime[] = catalog.anime.map((a) => ({
  ...a,
  episodes: a.seasons.flatMap((s) =>
    Array.from({ length: s.episodeCount }, (_, i) => ({
      id: `${a.id}-s${s.number}-e${i + 1}`,
      animeId: a.id,
      seasonNumber: s.number,
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      videoUrl: "",
      duration: a.episodeDuration,
      thumbnail: s.bannerImage,
    })),
  ),
}));

/** "S2 E5" for multi-season shows, "E5" otherwise. */
export const episodeLabel = (a: Anime, ep: Episode) => (a.seasons.length > 1 ? `S${ep.seasonNumber} E${ep.episodeNumber}` : `E${ep.episodeNumber}`);

export const mangaList: Manga[] = catalog.manga.map((m) => ({
  ...m,
  chapters: Array.from({ length: m.chapterCount }, (_, i) => ({
    id: `${m.id}-ch-${i + 1}`,
    mangaId: m.id,
    chapterNumber: i + 1,
    title: `Chapter ${i + 1}`,
    pageCount: PAGES_PER_CHAPTER,
  })),
}));

/** Pages are built on demand; eagerly creating them for ~10k chapters is wasted work. */
export function getPages(manga: Manga, chapter: Chapter): MangaPage[] {
  return Array.from({ length: chapter.pageCount }, (_, j) => ({
    id: `${chapter.id}-pg-${j + 1}`,
    chapterId: chapter.id,
    imageUrl: manga.coverImage, // ponytail: placeholder art until real page scans exist
    pageNumber: j + 1,
  }));
}

const byPopularity = <T extends { popularity: number }>(list: T[]) => [...list].sort((a, b) => b.popularity - a.popularity);
const byRating = <T extends { rating: number }>(list: T[]) => [...list].sort((a, b) => b.rating - a.rating);

export const trendingAnime = [
  ...byPopularity(animeList.filter((a) => a.status === "ONGOING")),
  ...byPopularity(animeList.filter((a) => a.status !== "ONGOING")),
].slice(0, 15);
export const popularAnime = byPopularity(animeList).slice(0, 20);
export const topRatedAnime = byRating(animeList).slice(0, 20);
export const newReleases = [...animeList].sort((a, b) => b.year - a.year).slice(0, 15);
export const trendingManga = byPopularity(mangaList.filter((m) => m.status === "ONGOING")).slice(0, 15);
export const popularManga = byPopularity(mangaList).slice(0, 20);
export const topRatedManga = byRating(mangaList).slice(0, 20);

const anime = (title: string) => {
  const a = animeList.find((x) => x.title.toLowerCase().includes(title.toLowerCase()));
  if (!a) throw new Error(`mock-data: no anime titled "${title}" in catalog.json`);
  return a;
};
const manga = (title: string) => {
  const m = mangaList.find((x) => x.title.toLowerCase().includes(title.toLowerCase()));
  if (!m) throw new Error(`mock-data: no manga titled "${title}" in catalog.json`);
  return m;
};

// Watch/read progress is real now: see src/lib/progress.ts (saved in the browser).

export const mockUser: UserProfile = {
  id: "u1",
  username: "ShadowBlade99",
  email: "shadow@mugenkai.dev",
  avatarUrl: anime("Vinland Saga").coverImage,
  bio: "Just a wanderer seeking the next great story.",
  role: "ADMIN",
  preferredGenres: ["Action", "Fantasy", "Drama"],
  watchHistory: [],
  favorites: [anime("Frieren"), anime("Steins;Gate"), manga("Berserk"), manga("Vagabond")],
};

/** Every genre present in the catalog, most common first. */
export const allGenres = [
  ...[...animeList, ...mangaList]
    .flatMap((s) => s.genres)
    .reduce((m, g) => m.set(g, (m.get(g) ?? 0) + 1), new Map<string, number>()),
]
  .sort((a, b) => b[1] - a[1])
  .map(([g]) => g);

// ---------------------------------------------------------------------------
// Seasons, volumes and the mock user's progress (derived, deterministic).
// ---------------------------------------------------------------------------

export interface Season {
  id: string;
  number: number;
  title: string; // "Season 2" or "Season 1 · 101–200" for long runners
  subtitle: string; // the season's own name, e.g. "Attack on Titan Season 2"
  year: number;
  cover: string;
  episodes: Episode[];
}

export interface Volume {
  id: string;
  number: number;
  title: string;
  cover: string;
  chapters: Chapter[];
}

const ARC_SIZE = 100;

/** Real seasons from AniList; a season longer than 100 episodes (One Piece, Naruto) is split into 100-episode ranges. */
export function getSeasons(a: Anime): Season[] {
  return a.seasons.flatMap((s) => {
    const episodes = a.episodes.filter((e) => e.seasonNumber === s.number);
    const base = a.seasons.length > 1 ? `Season ${s.number}` : "Episodes";
    if (episodes.length <= ARC_SIZE) {
      return [{ id: `${a.id}-s${s.number}`, number: s.number, title: a.seasons.length > 1 ? base : "Season 1", subtitle: s.title, year: s.year, cover: s.bannerImage, episodes }];
    }
    const parts: Season[] = [];
    for (let start = 0; start < episodes.length; start += ARC_SIZE) {
      const chunk = episodes.slice(start, start + ARC_SIZE);
      const range = `${chunk[0].episodeNumber}–${chunk[chunk.length - 1].episodeNumber}`;
      parts.push({
        id: `${a.id}-s${s.number}-p${start / ARC_SIZE + 1}`,
        number: s.number,
        title: a.seasons.length > 1 ? `${base} · ${range}` : `${base} ${range}`,
        subtitle: s.title,
        year: s.year,
        cover: s.bannerImage,
        episodes: chunk,
      });
    }
    return parts;
  });
}

/** Group chapters into the real volume count when known, else 10 per volume. */
export function getVolumes(m: Manga): Volume[] {
  const size = m.volumeCount ? Math.ceil(m.chapters.length / m.volumeCount) : 10;
  const volumes: Volume[] = [];
  for (let start = 0, n = 1; start < m.chapters.length; start += size, n++) {
    volumes.push({
      id: `${m.id}-v${n}`,
      number: n,
      title: `Volume ${n}`,
      cover: m.coverImage,
      chapters: m.chapters.slice(start, start + size),
    });
  }
  return volumes;
}

/** The newest episode or chapter of an ongoing series counts as new. */
export const isNewRelease = (status: Status, index: number, total: number) => status === "ONGOING" && index === total - 1;

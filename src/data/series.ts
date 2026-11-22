import type { Anime, AnimeSummary, Chapter, Episode, Manga, MangaSummary, Status } from "./schema";

// Pure catalog helpers, safe for the browser (no bundled catalog data here).

type Seasonal = Pick<AnimeSummary, "id" | "seasons">;

/** "S2 E5" for multi-season shows, "E5" otherwise. */
export const episodeLabel = (a: Seasonal, ep: Pick<Episode, "seasonNumber" | "episodeNumber">) =>
  a.seasons.length > 1 ? `S${ep.seasonNumber} E${ep.episodeNumber}` : `E${ep.episodeNumber}`;

/** Episode ids are "<animeId>-s<season>-e<number>" everywhere (demo and database). */
export const episodeId = (animeId: string, season: number, number: number) => `${animeId}-s${season}-e${number}`;

export function parseEpisodeId(id: string): { animeId: string; season: number; number: number } | null {
  const m = id.match(/^(.+)-s(\d+)-e(\d+)$/);
  return m ? { animeId: m[1], season: Number(m[2]), number: Number(m[3]) } : null;
}

/** Chapter ids are "<mangaId>-ch-<number>". */
export function parseChapterId(id: string): { mangaId: string; number: number } | null {
  const m = id.match(/^(.+)-ch-([\d.]+)$/);
  return m ? { mangaId: m[1], number: Number(m[2]) } : null;
}

// ─── Navbar search ──────────────────────────────────────────────────────────

/** Just what the search palette shows; built on the server so the full catalog never ships to the browser. */
export interface SearchResult {
  id: string;
  title: string;
  cover: string;
  href: string;
  meta: string;
  keywords: string[];
  rating: number;
}
export interface SearchIndex {
  anime: SearchResult[];
  manga: SearchResult[];
}

export function searchIndex(anime: AnimeSummary[], manga: MangaSummary[]): SearchIndex {
  const byRatingDesc = (a: SearchResult, b: SearchResult) => b.rating - a.rating;
  return {
    anime: anime
      .map((a) => ({
        id: a.id,
        title: a.title,
        cover: a.coverImage,
        href: `/anime/${a.id}`,
        meta: `${a.year} · ${a.episodeCount} episodes · ${a.studio}`,
        keywords: [a.nativeTitle, ...a.genres],
        rating: a.rating,
      }))
      .sort(byRatingDesc),
    manga: manga
      .map((m) => {
        const countStr =
          m.chapterCount && m.chapterCount > 0
            ? `${m.chapterCount} chs`
            : m.status === "ONGOING"
            ? "Ongoing"
            : "";
        return {
          id: m.id,
          title: m.title,
          cover: m.coverImage,
          href: `/manga/${m.id}`,
          meta: [m.year, countStr, m.author].filter(Boolean).join(" · "),
          keywords: [m.nativeTitle, m.author, ...m.genres],
          rating: m.rating,
        };
      })
      .sort(byRatingDesc),
  };
}

// ─── Home page rows ─────────────────────────────────────────────────────────

const byPopularity = <T extends { popularity: number }>(list: T[]) => [...list].sort((a, b) => b.popularity - a.popularity);
const byRating = <T extends { rating: number }>(list: T[]) => [...list].sort((a, b) => b.rating - a.rating);

export function homeRows(anime: AnimeSummary[], manga: MangaSummary[]) {
  return {
    trendingAnime: [...byPopularity(anime.filter((a) => a.status === "ONGOING")), ...byPopularity(anime.filter((a) => a.status !== "ONGOING"))].slice(0, 15),
    popularAnime: byPopularity(anime).slice(0, 20),
    topRatedAnime: byRating(anime).slice(0, 20),
    newReleases: [...anime].sort((a, b) => b.year - a.year).slice(0, 15),
    trendingManga: byPopularity(manga.filter((m) => m.status === "ONGOING")).slice(0, 15),
    popularManga: byPopularity(manga).slice(0, 20),
    topRatedManga: byRating(manga).slice(0, 20),
  };
}

/**
 * "Because you watched X": titles of the same medium sharing the most genres with `seed`,
 * excluding anything the user already started or saved. Ties go to the higher rated.
 */
export function similarTo<T extends { id: string; genres: string[]; rating: number }>(seed: T, pool: T[], exclude: Set<string>, limit = 15): T[] {
  const genres = new Set(seed.genres);
  return pool
    .filter((x) => x.id !== seed.id && !exclude.has(x.id))
    .map((x) => ({ x, shared: x.genres.filter((g) => genres.has(g)).length }))
    .filter((r) => r.shared >= Math.min(2, genres.size))
    .sort((a, b) => b.shared - a.shared || b.x.rating - a.x.rating)
    .slice(0, limit)
    .map((r) => r.x);
}

// ---------------------------------------------------------------------------
// Seasons and volumes (derived, deterministic).
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
  // Split by the series total, not what's readable here: 16 of 201 chapters over 18 volumes is still ~11 per volume.
  const size = m.volumeCount ? Math.max(1, Math.ceil(Math.max(m.chapterCount, m.chapters.length) / m.volumeCount)) : 10;
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

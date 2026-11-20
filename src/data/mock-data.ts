import raw from "./catalog.json";
import {
  CatalogSchema,
  type Anime,
  type Chapter,
  type Episode,
  type Manga,
  type MangaPage,
} from "./schema";

// Server-only: the bundled demo catalog, used when DATABASE_URL is not set (see src/server/catalog.ts).
export type { Anime, Chapter, Episode, Manga, MangaPage } from "./schema";

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
      links: [],
    })),
  ),
  links: [],
}));


export const mangaList: Manga[] = catalog.manga.map((m) => ({
  ...m,
  chapters: Array.from({ length: m.chapterCount }, (_, i) => ({
    id: `${m.id}-ch-${i + 1}`,
    mangaId: m.id,
    chapterNumber: i + 1,
    title: `Chapter ${i + 1}`,
    pageCount: PAGES_PER_CHAPTER,
    externalUrl: null,
    mangadexChapterId: null,
    scanlationGroup: null,
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

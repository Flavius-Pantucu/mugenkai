import { z } from "zod";

/** Single source of truth for the app's data shapes. Types are inferred, never hand-written. */

export const StatusSchema = z.enum(["ONGOING", "COMPLETED"]);

const seriesBase = {
  id: z.string().min(1),
  title: z.string().min(1),
  nativeTitle: z.string().min(1),
  description: z.string(),
  coverImage: z.url(),
  bannerImage: z.url(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .nullable(),
  status: StatusSchema,
  rating: z.number().min(0).max(10),
  popularity: z.number().int().nonnegative(),
  year: z.number().int().min(1900).max(2100),
  genres: z.array(z.string().min(1)).min(1),
};

// One aired TV season of a show (AniList lists each season as its own entry).
export const AnimeSeasonSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  episodeCount: z.number().int().positive(),
  coverImage: z.url(),
  bannerImage: z.url(),
});

// Raw catalog as written by scripts/fetch-catalog.mjs.
export const CatalogAnimeSchema = z.object({
  ...seriesBase,
  studio: z.string().min(1),
  episodeCount: z.number().int().positive(), // across all seasons
  episodeDuration: z.number().int().positive(),
  trailerYoutubeId: z.string().nullable(),
  seasons: z.array(AnimeSeasonSchema).min(1),
});

export const CatalogMangaSchema = z.object({
  ...seriesBase,
  author: z.string().min(1),
  chapterCount: z.number().int().positive(),
  volumeCount: z.number().int().positive().nullable(),
});

export const CatalogSchema = z.object({
  fetchedAt: z.iso.date(),
  anime: z.array(CatalogAnimeSchema).min(1),
  manga: z.array(CatalogMangaSchema).min(1),
});

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  animeId: z.string().min(1),
  seasonNumber: z.number().int().positive(),
  episodeNumber: z.number().int().positive(), // within its season
  title: z.string().min(1),
  videoUrl: z.string(),
  duration: z.number().int().positive(),
  thumbnail: z.url(),
});

export const ChapterSchema = z.object({
  id: z.string().min(1),
  mangaId: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1),
  pageCount: z.number().int().positive(),
});

export const MangaPageSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  imageUrl: z.url(),
  pageNumber: z.number().int().positive(),
});

export const AnimeSchema = CatalogAnimeSchema.extend({ episodes: z.array(EpisodeSchema) });
export const MangaSchema = CatalogMangaSchema.extend({ chapters: z.array(ChapterSchema) });

export const WatchHistorySchema = z.object({
  id: z.string().min(1),
  animeId: z.string().min(1),
  episodeId: z.string().min(1),
  progress: z.number().min(0).max(100),
  anime: AnimeSchema,
  episode: EpisodeSchema,
});

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(24),
  email: z.email(),
  avatarUrl: z.url(),
  bio: z.string().max(280),
  role: z.enum(["USER", "ADMIN"]),
  preferredGenres: z.array(z.string()),
  watchHistory: z.array(WatchHistorySchema),
  favorites: z.array(z.union([AnimeSchema, MangaSchema])),
});

// Forms (validated client-side now, and by the API once it exists).
export const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(24, "At most 24 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "Accept the terms to continue"),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const ProfileSettingsSchema = UserProfileSchema.pick({ username: true, email: true, bio: true }).extend({
  matureContent: z.boolean(),
  notifications: z.boolean(),
});

// Viewing progress, persisted in the browser until there is an API. Validated on every read.
export const ProgressStateSchema = z.object({
  episodes: z.record(z.string(), z.object({ progress: z.number().min(0).max(100), updatedAt: z.number().int() })),
  chapters: z.record(
    z.string(),
    z.object({ page: z.number().int().positive(), pageCount: z.number().int().positive(), updatedAt: z.number().int() }),
  ),
});

// Comment threads: "anime:<id>", "manga:<id>", "episode:<id>", "chapter:<id>".
export const ThreadIdSchema = z.string().regex(/^(anime|manga|episode|chapter):[\w-]+$/);

export const CommentSchema = z.object({
  id: z.string().min(1),
  threadId: ThreadIdSchema,
  parentId: z.string().nullable().default(null), // null = top-level; default keeps pre-reply data valid
  author: z.object({ name: z.string().min(1), avatarUrl: z.url().nullable() }),
  body: z.string().min(1).max(2000),
  spoiler: z.boolean(),
  likes: z.number().int().nonnegative(),
  createdAt: z.number().int(),
});

export const CommentsStateSchema = z.object({
  posted: z.array(CommentSchema),
  liked: z.array(z.string()),
  deleted: z.array(z.string()),
});

export const CommentInputSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000, "Keep it under 2000 characters"),
  spoiler: z.boolean(),
});

// Admin "add series" dialog.
export const SeriesFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(10, "At least 10 characters"),
  status: StatusSchema,
  rating: z.number({ error: "Enter a number" }).min(0, "0 to 10").max(10, "0 to 10"),
  coverImage: z.url("Enter a full image URL"),
});

export type Status = z.infer<typeof StatusSchema>;
export type ProgressState = z.infer<typeof ProgressStateSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type CommentsState = z.infer<typeof CommentsStateSchema>;
export type CommentInput = z.infer<typeof CommentInputSchema>;
export type SeriesFormInput = z.infer<typeof SeriesFormSchema>;
export type ProfileSettingsInput = z.infer<typeof ProfileSettingsSchema>;
export type Anime = z.infer<typeof AnimeSchema>;
export type Manga = z.infer<typeof MangaSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type AnimeSeason = z.infer<typeof AnimeSeasonSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type MangaPage = z.infer<typeof MangaPageSchema>;
export type WatchHistory = z.infer<typeof WatchHistorySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

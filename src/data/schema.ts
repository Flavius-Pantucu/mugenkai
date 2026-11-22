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

/** An official place to watch, e.g. a Crunchyroll episode page. */
export const StreamingLinkSchema = z.object({ provider: z.string().min(1), url: z.url() });

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  animeId: z.string().min(1),
  seasonNumber: z.number().int().positive(),
  episodeNumber: z.number().int().positive(), // within its season
  title: z.string().min(1),
  videoUrl: z.string(),
  duration: z.number().int().positive(),
  thumbnail: z.url(),
  links: z.array(StreamingLinkSchema).default([]),
});

export const ChapterSchema = z.object({
  id: z.string().min(1),
  mangaId: z.string().min(1),
  chapterNumber: z.number().nonnegative(), // MangaDex has 0 and 10.5
  title: z.string().min(1),
  pageCount: z.number().int().nonnegative(),
  /** Official reader link when MangaDex hosts no pages for this chapter (e.g. MANGA Plus). */
  externalUrl: z.url().nullable().default(null),
  mangadexChapterId: z.string().nullable().default(null),
  /** MangaDex requires crediting the group whose translation is shown. */
  scanlationGroup: z.string().nullable().default(null),
});

export const MangaPageSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  imageUrl: z.url(),
  pageNumber: z.number().int().positive(),
});

/** List/card shape: everything except the per-episode / per-chapter arrays. */
export const AnimeSummarySchema = CatalogAnimeSchema;
export const MangaSummarySchema = CatalogMangaSchema.extend({ firstChapterId: z.string().nullable() });

export const AnimeSchema = CatalogAnimeSchema.extend({
  episodes: z.array(EpisodeSchema),
  links: z.array(StreamingLinkSchema).default([]), // series-level "where to watch"
});
export const MangaSchema = CatalogMangaSchema.extend({
  chapters: z.array(ChapterSchema), // what can be read here; chapterCount is the series total
  links: z.array(StreamingLinkSchema).default([]), // official readers
});

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(24),
  email: z.email(),
  avatarUrl: z.url().nullable(),
  bio: z.string().max(280),
  role: z.enum(["USER", "ADMIN"]),
  matureContent: z.boolean(),
  notifications: z.boolean(),
});

// Forms (validated client-side now, and by the API once it exists).
export const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const NewPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter");

export const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(24, "At most 24 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
    email: z.email("Enter a valid email address"),
    password: NewPassword,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "Accept the terms to continue"),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

// Avatars are AniList character portraits only, so users can't point everyone's browser at arbitrary URLs.
export const AVATAR_PREFIX = "https://s4.anilist.co/file/anilistcdn/character/";
export const ProfileSettingsSchema = UserProfileSchema.pick({ username: true, email: true, bio: true, matureContent: true, notifications: true }).extend({
  avatarUrl: z
    .url()
    .refine((u) => u.startsWith(AVATAR_PREFIX), "Pick an avatar from the character list")
    .nullable()
    .optional(),
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

// ─── API request/response bodies (validated on both ends) ────────────────────

export const EpisodeProgressInputSchema = z.object({
  episodeId: z.string().min(1).max(64),
  progress: z.number().min(0).max(100),
  updatedAt: z.number().int().optional(), // client clock; server keeps the newest write
});

export const ChapterProgressInputSchema = z.object({
  chapterId: z.string().min(1).max(64),
  page: z.number().int().positive(),
  pageCount: z.number().int().positive(),
  updatedAt: z.number().int().optional(),
});

export const CommentPostSchema = CommentInputSchema.extend({
  threadId: ThreadIdSchema,
  parentId: z.uuid().nullable().default(null),
});

/** A comment as the API returns it: author resolved, viewer-specific flags filled in. */
export const ApiCommentSchema = CommentSchema.extend({
  likedByMe: z.boolean(),
  mine: z.boolean(),
  removed: z.boolean(),
});

export const LIST_STATUSES = ["CURRENT", "PLANNING", "COMPLETED", "PAUSED", "DROPPED"] as const;
export const ListStatusSchema = z.enum(LIST_STATUSES);
export type ListStatus = z.infer<typeof ListStatusSchema>;

export const ListScoreSchema = z.number().int().min(1).max(10);
export const ListEntrySchema = z.object({
  seriesId: z.string().min(1).max(64),
  status: ListStatusSchema,
  score: ListScoreSchema.nullable().default(null), // the user's own rating
});
export type ListEntry = z.infer<typeof ListEntrySchema>;
export const ListEntryInputSchema = z.object({
  status: ListStatusSchema.default("PLANNING"),
  score: ListScoreSchema.nullable().optional(), // omitted = keep the current score
});

/** Browser copy of the list, newest first. Accepts the old `{ seriesIds }` shape (everything becomes "Planning"). */
export const ListStateSchema = z.union([
  z.object({ entries: z.array(ListEntrySchema) }),
  z.object({ seriesIds: z.array(z.string()) }).transform(({ seriesIds }) => ({
    entries: seriesIds.map((seriesId): ListEntry => ({ seriesId, status: "PLANNING", score: null })),
  })),
]);

/** One upcoming or just-aired episode on the weekly schedule (AniList airing schedule). */
export const ScheduleEntrySchema = z.object({
  id: z.number().int(),
  airingAt: z.number().int(), // unix seconds
  episode: z.number().int().positive(),
  mediaId: z.number().int(),
  title: z.string().min(1),
  cover: z.url(),
  totalEpisodes: z.number().int().positive().nullable(),
  popularity: z.number().int().nonnegative(),
  /** Set when the show is in our catalog: links to its series page. */
  seriesId: z.string().nullable(),
});

/** One title in a trending window (AniList trend scores summed over the window). */
export const TrendingEntrySchema = z.object({
  key: z.string(), // series id when in our catalog, else "anilist:<mediaId>"
  title: z.string().min(1),
  cover: z.url(),
  score: z.number().nonnegative(),
  /** In our catalog: link to the series page. Otherwise href is the AniList page. */
  seriesId: z.string().nullable(),
  href: z.string(),
  meta: z.string(), // "TV · Episode 8" or genres
});

export const TRENDING_WINDOWS = ["day", "week", "month"] as const;
export type TrendingWindow = (typeof TRENDING_WINDOWS)[number];
export type TrendingEntry = z.infer<typeof TrendingEntrySchema>;
export type Trending = Record<TrendingWindow, TrendingEntry[]>;

export type Status = z.infer<typeof StatusSchema>;
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;
export type ApiComment = z.infer<typeof ApiCommentSchema>;
export type ProgressState = z.infer<typeof ProgressStateSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type CommentsState = z.infer<typeof CommentsStateSchema>;
export type CommentInput = z.infer<typeof CommentInputSchema>;
export type ProfileSettingsInput = z.infer<typeof ProfileSettingsSchema>;
export type Anime = z.infer<typeof AnimeSchema>;
export type AnimeSummary = z.infer<typeof AnimeSummarySchema>;
export type MangaSummary = z.infer<typeof MangaSummarySchema>;
export type StreamingLink = z.infer<typeof StreamingLinkSchema>;
export type Manga = z.infer<typeof MangaSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type AnimeSeason = z.infer<typeof AnimeSeasonSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type MangaPage = z.infer<typeof MangaPageSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export const ForgotPasswordSchema = z.object({ email: z.email("Enter a valid email address") });

export const ResetPasswordSchema = z
  .object({ token: z.string().min(1), password: NewPassword, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

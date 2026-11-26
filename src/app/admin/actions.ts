"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { logSecurityEvent } from "@/server/http";
import type { FooterColumnItem, NavLinkItem } from "@/server/site-config";
import { isJobName, runJob } from "@/server/sync/jobs";

function revalidateAllCatalog() {
  revalidateTag("catalog", "max");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/anime");
  revalidatePath("/manga");
}

/** "Run now". Same code path as the cron routes. */
export async function runSync(job: string) {
  const me = await requireAdmin();
  if (!isJobName(job)) throw new Error(`Unknown job: ${job}`);
  const result = await runJob(job);
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} ran sync:${job}`);
  revalidatePath("/admin");
  return result.ok ? { ok: true as const, ms: result.ms } : { ok: false as const, error: result.error };
}

/** Admins cannot act on their own account here, so nobody locks themselves out by accident. */
async function otherUser(userId: string) {
  const me = await requireAdmin();
  if (userId === me.id) throw new Error("You can't change your own account here");
  return { id: userId, me };
}

export async function setUserRole(userId: string, role: "USER" | "ADMIN") {
  const { id, me } = await otherUser(userId);
  if (role !== "USER" && role !== "ADMIN") throw new Error("Unknown role");
  await db().user.update({ where: { id }, data: { role } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} set role=${role} on ${id}`);
  revalidatePath("/admin");
}

export async function signOutUser(userId: string) {
  const { id, me } = await otherUser(userId);
  await db().session.deleteMany({ where: { userId: id } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} signed out ${id}`);
  revalidatePath("/admin");
}

/** Cascades to sessions, progress, list, likes and comments (with the replies under them). */
export async function deleteUser(userId: string) {
  const { id, me } = await otherUser(userId);
  await db().user.delete({ where: { id } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} deleted user ${id}`);
  revalidatePath("/admin");
}

export async function banUser(userId: string, reason?: string) {
  const { id, me } = await otherUser(userId);
  await db().$transaction([
    db().user.update({ where: { id }, data: { bannedAt: new Date(), banReason: reason?.trim() || "Suspended by administrator" } }),
    db().session.deleteMany({ where: { userId: id } }),
  ]);
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} banned ${id}`);
  revalidatePath("/admin");
}

export async function unbanUser(userId: string) {
  const { id, me } = await otherUser(userId);
  await db().user.update({ where: { id }, data: { bannedAt: null, banReason: null } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} unbanned ${id}`);
  revalidatePath("/admin");
}

export async function muteUser(userId: string, hours: number) {
  const { id, me } = await otherUser(userId);
  const mutedUntil = hours > 0 ? new Date(Date.now() + hours * 3_600_000) : null;
  await db().user.update({ where: { id }, data: { mutedUntil } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} ${hours > 0 ? `muted ${id} for ${hours}h` : `unmuted ${id}`}`);
  revalidatePath("/admin");
}

export async function getUserDetailsForAdmin(userId: string) {
  await requireAdmin();
  const [sessions, list, epProgress, chProgress, comments] = await Promise.all([
    db().session.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, expiresAt: true } }),
    db().listEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { status: true, score: true, series: { select: { id: true, title: true, kind: true } } },
    }),
    db().episodeProgress.count({ where: { userId } }),
    db().chapterProgress.count({ where: { userId } }),
    db().comment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, threadId: true, body: true, createdAt: true, deletedAt: true },
    }),
  ]);
  return {
    sessions: sessions.map((s) => ({ id: s.id, createdAt: s.createdAt.toISOString(), expiresAt: s.expiresAt.toISOString() })),
    list,
    epProgress,
    chProgress,
    comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), deletedAt: c.deletedAt?.toISOString() ?? null })),
  };
}

// ─── Site CMS & Settings ────────────────────────────────────────────────────

export interface SiteConfigInput {
  siteName: string;
  tagline: string;
  footerCopyright: string;
  announcementText: string | null;
  announcementLink: string | null;
  announcementType: "info" | "warning" | "success";
  announcementActive: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  registrationOpen: boolean;
  commentsEnabled: boolean;
  downloadsEnabled: boolean;
  heroMode: "auto" | "pinned" | "mixed";
  pinnedHeroIds: string[];
  footerLinks: FooterColumnItem[] | null;
  navLinks: NavLinkItem[] | null;
}

export async function updateSiteConfig(input: SiteConfigInput) {
  const me = await requireAdmin();
  const data = {
    siteName: input.siteName.trim() || "Mugenkai",
    tagline: input.tagline.trim(),
    footerCopyright: input.footerCopyright.trim(),
    announcementText: input.announcementText?.trim() || null,
    announcementLink: input.announcementLink?.trim() || null,
    announcementType: input.announcementType,
    announcementActive: input.announcementActive,
    maintenanceMode: input.maintenanceMode,
    maintenanceMessage: input.maintenanceMessage.trim() || "We are performing scheduled maintenance. Back shortly.",
    registrationOpen: input.registrationOpen,
    commentsEnabled: input.commentsEnabled,
    downloadsEnabled: input.downloadsEnabled,
    heroMode: input.heroMode,
    pinnedHeroIds: input.pinnedHeroIds.map((s) => s.trim()).filter(Boolean),
    footerLinks: input.footerLinks ? (input.footerLinks as object) : undefined,
    navLinks: input.navLinks ? (input.navLinks as object) : undefined,
  };

  await db().siteConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} updated site config`);
  revalidateTag("site-config", "max");
  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

// ─── Catalog CRUD ───────────────────────────────────────────────────────────

export interface UpsertSeriesInput {
  id: string;
  kind: "ANIME" | "MANGA";
  title: string;
  nativeTitle: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  color: string | null;
  status: "ONGOING" | "COMPLETED";
  rating: number;
  popularity: number;
  year: number;
  genres: string[];
  studio?: string | null;
  episodeDuration?: number | null;
  trailerYoutubeId?: string | null;
  author?: string | null;
  volumeCount?: number | null;
  chapterTotal?: number | null;
  mangadexId?: string | null;
  malId?: number | null;
}

export async function upsertSeries(input: UpsertSeriesInput) {
  const me = await requireAdmin();
  const id = input.id.trim();
  if (!id) throw new Error("Series ID is required");

  const data = {
    kind: input.kind,
    title: input.title.trim(),
    nativeTitle: input.nativeTitle.trim() || input.title.trim(),
    description: input.description.trim(),
    coverImage: input.coverImage.trim(),
    bannerImage: input.bannerImage.trim() || input.coverImage.trim(),
    color: input.color?.trim() || null,
    status: input.status,
    rating: Math.max(0, Math.min(10, Number(input.rating) || 0)),
    popularity: Math.max(0, Math.round(Number(input.popularity) || 0)),
    year: Math.max(1900, Math.min(2100, Math.round(Number(input.year) || 2026))),
    genres: input.genres.map((g) => g.trim()).filter(Boolean),
    studio: input.kind === "ANIME" ? input.studio?.trim() || null : null,
    episodeDuration: input.kind === "ANIME" && input.episodeDuration ? Math.round(input.episodeDuration) : null,
    trailerYoutubeId: input.kind === "ANIME" ? input.trailerYoutubeId?.trim() || null : null,
    author: input.kind === "MANGA" ? input.author?.trim() || null : null,
    volumeCount: input.kind === "MANGA" && input.volumeCount ? Math.round(input.volumeCount) : null,
    chapterTotal: input.kind === "MANGA" && input.chapterTotal ? Math.round(input.chapterTotal) : null,
    mangadexId: input.mangadexId?.trim() || null,
    malId: input.malId ? Math.round(input.malId) : null,
  };

  await db().series.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });

  // Ensure a newly created anime has at least Season 1 so it renders in catalog.
  if (input.kind === "ANIME") {
    const seasonCount = await db().season.count({ where: { seriesId: id } });
    if (seasonCount === 0) {
      await db().season.create({
        data: {
          id,
          seriesId: id,
          number: 1,
          title: data.title,
          year: data.year,
          episodeCount: 12,
          coverImage: data.coverImage,
          bannerImage: data.bannerImage,
          airing: data.status === "ONGOING",
        },
      });
    }
  }

  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} saved series ${id}`);
  revalidateAllCatalog();
  revalidatePath(`/anime/${id}`);
  revalidatePath(`/manga/${id}`);
}

export async function deleteSeries(seriesId: string) {
  const me = await requireAdmin();
  await db().series.delete({ where: { id: seriesId } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} deleted series ${seriesId}`);
  revalidateAllCatalog();
}

export async function getSeriesDetailsForAdmin(seriesId: string) {
  await requireAdmin();
  const [seasons, episodes, chapters, links] = await Promise.all([
    db().season.findMany({ where: { seriesId }, orderBy: { number: "asc" } }),
    db().episode.findMany({ where: { seriesId }, orderBy: [{ seasonNumber: "asc" }, { number: "asc" }] }),
    db().chapter.findMany({ where: { seriesId }, orderBy: { number: "desc" }, take: 200 }),
    db().streamingLink.findMany({ where: { seriesId } }),
  ]);
  return {
    seasons,
    episodes: episodes.map((e) => ({ ...e, airedAt: e.airedAt?.toISOString() ?? null })),
    chapters: chapters.map((c) => ({ ...c, publishedAt: c.publishedAt?.toISOString() ?? null })),
    links,
  };
}

export async function addStreamingLink(input: { seriesId: string; provider: string; url: string; language?: string }) {
  const me = await requireAdmin();
  await db().streamingLink.create({
    data: {
      seriesId: input.seriesId,
      provider: input.provider.trim(),
      url: input.url.trim(),
      language: input.language?.trim() || null,
    },
  });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} added link for ${input.seriesId}`);
  revalidateAllCatalog();
  revalidatePath(`/anime/${input.seriesId}`);
}

export async function deleteStreamingLink(linkId: string) {
  await requireAdmin();
  await db().streamingLink.delete({ where: { id: linkId } });
  revalidateAllCatalog();
}

export async function upsertEpisode(input: {
  seriesId: string;
  seasonId: string;
  seasonNumber: number;
  number: number;
  title: string;
  thumbnail: string;
  duration: number;
}) {
  await requireAdmin();
  const id = `${input.seriesId}-s${input.seasonNumber}-e${input.number}`;
  await db().episode.upsert({
    where: { id },
    create: {
      id,
      seriesId: input.seriesId,
      seasonId: input.seasonId,
      seasonNumber: input.seasonNumber,
      number: input.number,
      title: input.title.trim(),
      thumbnail: input.thumbnail.trim(),
      duration: Math.max(1, Math.round(input.duration)),
    },
    update: {
      title: input.title.trim(),
      thumbnail: input.thumbnail.trim(),
      duration: Math.max(1, Math.round(input.duration)),
    },
  });
  revalidateAllCatalog();
  revalidatePath(`/anime/${input.seriesId}`);
}

export async function deleteEpisode(episodeId: string) {
  await requireAdmin();
  await db().episode.delete({ where: { id: episodeId } });
  revalidateAllCatalog();
}

export async function upsertChapter(input: {
  seriesId: string;
  number: number;
  title: string;
  pageCount: number;
  externalUrl?: string | null;
  scanlationGroup?: string | null;
}) {
  await requireAdmin();
  const id = `${input.seriesId}-ch-${input.number}`;
  await db().chapter.upsert({
    where: { id },
    create: {
      id,
      seriesId: input.seriesId,
      number: input.number,
      title: input.title.trim() || `Chapter ${input.number}`,
      pageCount: Math.max(0, Math.round(input.pageCount)),
      externalUrl: input.externalUrl?.trim() || null,
      scanlationGroup: input.scanlationGroup?.trim() || null,
      publishedAt: new Date(),
    },
    update: {
      title: input.title.trim() || `Chapter ${input.number}`,
      pageCount: Math.max(0, Math.round(input.pageCount)),
      externalUrl: input.externalUrl?.trim() || null,
      scanlationGroup: input.scanlationGroup?.trim() || null,
    },
  });
  revalidateAllCatalog();
  revalidatePath(`/manga/${input.seriesId}`);
}

export async function deleteChapter(chapterId: string) {
  await requireAdmin();
  await db().chapter.delete({ where: { id: chapterId } });
  revalidateAllCatalog();
}

export async function updateSeason(input: { id: string; title: string; year: number; episodeCount: number; airing: boolean }) {
  await requireAdmin();
  await db().season.update({
    where: { id: input.id },
    data: {
      title: input.title.trim(),
      year: Math.round(input.year),
      episodeCount: Math.max(1, Math.round(input.episodeCount)),
      airing: input.airing,
    },
  });
  revalidateAllCatalog();
}

// ─── Comment & Report Moderation ────────────────────────────────────────────

export async function adminDeleteComment(commentId: string, hard = false) {
  const me = await requireAdmin();
  if (hard) {
    await db().comment.delete({ where: { id: commentId } });
  } else {
    await db().comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  }
  await db().commentReport.updateMany({ where: { commentId, status: "OPEN" }, data: { status: "RESOLVED" } });
  logSecurityEvent("ADMIN_ACTION", "admin", "/admin", `${me.username} ${hard ? "hard-" : ""}deleted comment ${commentId}`);
  revalidatePath("/admin");
}

export async function adminRestoreComment(commentId: string) {
  await requireAdmin();
  await db().comment.update({ where: { id: commentId }, data: { deletedAt: null } });
  revalidatePath("/admin");
}

export async function adminToggleSpoiler(commentId: string, spoiler: boolean) {
  await requireAdmin();
  await db().comment.update({ where: { id: commentId }, data: { spoiler } });
  revalidatePath("/admin");
}

export async function resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED") {
  await requireAdmin();
  await db().commentReport.update({ where: { id: reportId }, data: { status } });
  revalidatePath("/admin");
}

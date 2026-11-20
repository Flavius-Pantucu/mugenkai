-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SeriesKind" AS ENUM ('ANIME', 'MANGA');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('ONGOING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatarUrl" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "matureContent" BOOLEAN NOT NULL DEFAULT false,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "kind" "SeriesKind" NOT NULL,
    "malId" INTEGER,
    "mangadexId" TEXT,
    "title" TEXT NOT NULL,
    "nativeTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "color" TEXT,
    "status" "ReleaseStatus" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "popularity" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "genres" TEXT[],
    "studio" TEXT,
    "episodeDuration" INTEGER,
    "trailerYoutubeId" TEXT,
    "author" TEXT,
    "volumeCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "episodeCount" INTEGER NOT NULL,
    "coverImage" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "airing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "airedAt" TIMESTAMP(3),

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "number" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "mangadexChapterId" TEXT,
    "externalUrl" TEXT,
    "scanlationGroup" TEXT,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamingLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "language" TEXT,
    "seriesId" TEXT,
    "episodeId" TEXT,

    CONSTRAINT "StreamingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeProgress" (
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpisodeProgress_pkey" PRIMARY KEY ("userId","episodeId")
);

-- CreateTable
CREATE TABLE "ChapterProgress" (
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterProgress_pkey" PRIMARY KEY ("userId","chapterId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateTable
CREATE TABLE "ListEntry" (
    "userId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListEntry_pkey" PRIMARY KEY ("userId","seriesId")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "job" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastOkAt" TIMESTAMP(3),
    "lastError" TEXT,
    "summary" JSONB,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("job")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Series_mangadexId_key" ON "Series"("mangadexId");

-- CreateIndex
CREATE INDEX "Series_kind_popularity_idx" ON "Series"("kind", "popularity" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Season_seriesId_number_key" ON "Season"("seriesId", "number");

-- CreateIndex
CREATE INDEX "Episode_seriesId_idx" ON "Episode"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_mangadexChapterId_key" ON "Chapter"("mangadexChapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_seriesId_number_key" ON "Chapter"("seriesId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "StreamingLink_url_key" ON "StreamingLink"("url");

-- CreateIndex
CREATE INDEX "StreamingLink_seriesId_idx" ON "StreamingLink"("seriesId");

-- CreateIndex
CREATE INDEX "StreamingLink_episodeId_idx" ON "StreamingLink"("episodeId");

-- CreateIndex
CREATE INDEX "EpisodeProgress_userId_updatedAt_idx" ON "EpisodeProgress"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ChapterProgress_userId_updatedAt_idx" ON "ChapterProgress"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_threadId_createdAt_idx" ON "Comment"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamingLink" ADD CONSTRAINT "StreamingLink_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamingLink" ADD CONSTRAINT "StreamingLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeProgress" ADD CONSTRAINT "EpisodeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeProgress" ADD CONSTRAINT "EpisodeProgress_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterProgress" ADD CONSTRAINT "ChapterProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListEntry" ADD CONSTRAINT "ListEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListEntry" ADD CONSTRAINT "ListEntry_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;


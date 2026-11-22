"use client";

import { SeriesPage } from "@/components/SeriesPage";
import { ContentRow } from "@/components/ContentRow";
import { MangaCard } from "@/components/ContentCard";
import type { Manga, MangaSummary } from "@/data/schema";
import { chapterProgress, useProgress } from "@/lib/progress";

export function MangaDetailsPage({ manga, related, extras }: { manga: Manga; related: MangaSummary[]; extras?: React.ReactNode }) {
  const progressState = useProgress();
  const lastChapter = manga.chapters.at(-1);
  const count = `${manga.chapters.length} chapters`;

  const allChaptersGroup = {
    id: `${manga.id}-all-chapters`,
    title: "All Chapters",
    subtitle: manga.title,
    cover: manga.coverImage,
    range: `Chapters 1–${manga.chapters.length}`,
    units: manga.chapters.map((ch) => {
      const progress = chapterProgress(progressState, ch);
      const hasPageCount = ch.pageCount && ch.pageCount > 0 && ch.pageCount !== 20;
      const pagesLeft = hasPageCount ? Math.max(1, Math.round(ch.pageCount * (1 - progress / 100))) : 0;
      return {
        id: ch.id,
        number: ch.chapterNumber,
        label: `Ch. ${ch.chapterNumber}`,
        title: ch.title,
        image: manga.bannerImage || manga.coverImage,
        href: `/read/${manga.id}/${ch.id}`,
        pageCount: ch.pageCount,
        length: hasPageCount ? `${ch.pageCount} pages` : "Chapter",
        releasedAt: ch.releasedAt,
        remaining: pagesLeft > 0 ? `${pagesLeft} ${pagesLeft === 1 ? "page" : "pages"} left` : `${Math.round(progress)}% read`,
        progress,
        isNew: manga.status === "ONGOING" && ch === lastChapter,
      };
    }),
  };

  return (
    <SeriesPage
      kind="manga"
      title={manga.title}
      banner={manga.bannerImage}
      cover={manga.coverImage}
      rating={manga.rating}
      status={manga.status}
      facts={[String(manga.year), count, manga.author]}
      genres={manga.genres}
      description={manga.description}
      showProgress
      seriesId={manga.id}
      threadId={`manga:${manga.id}`}
      groups={[allChaptersGroup]}
      extras={extras}
      related={
        related.length > 0 && (
          <ContentRow title="More like this">
            {related.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </ContentRow>
        )
      }
    />
  );
}

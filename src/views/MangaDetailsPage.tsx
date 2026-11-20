"use client";

import { SeriesPage } from "@/components/SeriesPage";
import { ContentRow } from "@/components/ContentRow";
import { MangaCard } from "@/components/ContentCard";
import type { Manga, MangaSummary } from "@/data/schema";
import { getVolumes } from "@/data/series";
import { chapterProgress, useProgress } from "@/lib/progress";

export function MangaDetailsPage({ manga, related }: { manga: Manga; related: MangaSummary[] }) {
  const progressState = useProgress();
  const volumes = getVolumes(manga);
  const lastChapter = manga.chapters.at(-1);

  return (
    <SeriesPage
      kind="manga"
      title={manga.title}
      banner={manga.bannerImage}
      cover={manga.coverImage}
      rating={manga.rating}
      status={manga.status}
      facts={[String(manga.year), `${volumes.length} volumes · ${manga.chapters.length} chapters`, manga.author]}
      genres={manga.genres}
      description={manga.description}
      showProgress
      seriesId={manga.id}
      threadId={`manga:${manga.id}`}
      groups={volumes.map((v) => ({
        id: v.id,
        title: v.title,
        cover: v.cover,
        range: `Chapters ${v.chapters[0].chapterNumber}–${v.chapters[v.chapters.length - 1].chapterNumber}`,
        units: v.chapters.map((ch) => {
          const progress = chapterProgress(progressState, ch);
          const pagesLeft = Math.max(1, Math.round(ch.pageCount * (1 - progress / 100)));
          return {
            id: ch.id,
            number: ch.chapterNumber,
            label: `Ch. ${ch.chapterNumber}`,
            title: ch.title,
            image: manga.bannerImage,
            href: `/read/${manga.id}/${ch.id}`,
            pageCount: ch.pageCount,
            length: ch.externalUrl ? "Official site" : `${ch.pageCount} pages`,
            remaining: `${pagesLeft} ${pagesLeft === 1 ? "page" : "pages"} left`,
            progress,
            isNew: manga.status === "ONGOING" && ch === lastChapter,
          };
        }),
      }))}
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

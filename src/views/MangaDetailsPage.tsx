"use client";

import { useParams } from "next/navigation";
import { SeriesPage } from "@/components/SeriesPage";
import { ContentRow } from "@/components/ContentRow";
import { MangaCard } from "@/components/ContentCard";
import { mangaList, getVolumes, isNewRelease } from "@/data/mock-data";
import { chapterProgress, useProgress } from "@/lib/progress";
import { NotFoundPage } from "./NotFoundPage";

export function MangaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const progressState = useProgress(); // before the early return: hooks run every render
  const manga = mangaList.find((m) => m.id === id);
  if (!manga) return <NotFoundPage />;

  const volumes = getVolumes(manga);
  const shared = (genres: string[]) => genres.filter((g) => manga.genres.includes(g)).length;
  const related = mangaList
    .filter((m) => m.id !== manga.id && shared(m.genres) > 0)
    .sort((a, b) => shared(b.genres) - shared(a.genres) || b.popularity - a.popularity)
    .slice(0, 20);

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
            length: `${ch.pageCount} pages`,
            remaining: `${pagesLeft} ${pagesLeft === 1 ? "page" : "pages"} left`,
            progress,
            isNew: isNewRelease(manga.status, ch.chapterNumber - 1, manga.chapters.length),
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

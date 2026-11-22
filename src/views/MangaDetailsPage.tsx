"use client";

import { ExternalLink } from "lucide-react";
import { SeriesPage } from "@/components/SeriesPage";
import { Button } from "@/components/ui/button";
import { ContentRow } from "@/components/ContentRow";
import { MangaCard } from "@/components/ContentCard";
import type { Manga, MangaSummary } from "@/data/schema";
import { getVolumes } from "@/data/series";
import { chapterProgress, useProgress } from "@/lib/progress";

export function MangaDetailsPage({ manga, related, extras }: { manga: Manga; related: MangaSummary[]; extras?: React.ReactNode }) {
  const progressState = useProgress();
  const volumes = getVolumes(manga);
  const lastChapter = manga.chapters.at(-1);
  const readable = manga.chapters.filter((c) => !c.externalUrl).length;
  const total = Math.max(manga.chapterCount, manga.chapters.length);
  const count = manga.chapters.length < total ? `${manga.chapters.length} of ${total} chapters` : `${total} chapters`;

  return (
    <SeriesPage
      kind="manga"
      title={manga.title}
      banner={manga.bannerImage}
      cover={manga.coverImage}
      rating={manga.rating}
      status={manga.status}
      facts={[String(manga.year), manga.volumeCount ? `${manga.volumeCount} volumes · ${count}` : count, manga.author]}
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
      notice={(readable < total || manga.chapters.length === 0) && <AvailabilityNotice manga={manga} readable={readable} total={total} />}
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

/** Licensed series lose their English scans on MangaDex; say so and point to the official readers. */
function AvailabilityNotice({ manga, readable, total }: { manga: Manga; readable: number; total: number }) {
  const what =
    manga.chapters.length === 0
      ? "No chapters of this series can be read here yet."
      : readable === 0
        ? `None of the ${total} chapters are hosted here; the ones listed open on the publisher's site.`
        : `${readable} of ${total} chapters can be read here. The rest are licensed and only available officially.`;
  // One button per reader: AniList sometimes lists a site twice (e.g. two VIZ pages).
  const links = manga.links.filter((l, i, all) => all.findIndex((x) => x.provider === l.provider) === i);
  return (
    <div className="rounded-xl border border-white/10 bg-ink-raised p-4 sm:p-5">
      <p className="text-[14.5px] text-zinc-200">{what}</p>
      {links.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <Button key={l.url} asChild variant="outline" size="sm">
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                Read on {l.provider}
                <ExternalLink className="opacity-60" />
              </a>
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[13px] text-muted-foreground">No official English reader is listed for it yet.</p>
      )}
    </div>
  );
}

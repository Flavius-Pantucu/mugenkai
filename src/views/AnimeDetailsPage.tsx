"use client";

import { SeriesPage } from "@/components/SeriesPage";
import { ContentRow } from "@/components/ContentRow";
import { AnimeCard } from "@/components/ContentCard";
import type { Anime, AnimeSummary } from "@/data/schema";
import { episodeLabel, getSeasons } from "@/data/series";
import { episodeProgress, useProgress } from "@/lib/progress";

import type { FranchiseSeason } from "@/server/details";

export function AnimeDetailsPage({
  anime,
  related,
  franchiseSeasons,
  extras,
}: {
  anime: Anime;
  related: AnimeSummary[];
  franchiseSeasons?: FranchiseSeason[];
  extras?: React.ReactNode;
}) {
  const progressState = useProgress();
  const seasons = getSeasons(anime);
  const lastEpisode = anime.episodes.at(-1);

  return (
    <SeriesPage
      kind="anime"
      title={anime.title}
      banner={anime.bannerImage}
      cover={anime.coverImage}
      rating={anime.rating}
      status={anime.status}
      facts={[
        String(anime.year),
        anime.seasons.length > 1 ? `${anime.seasons.length} seasons · ${anime.episodes.length} episodes` : `${anime.episodes.length} episodes`,
        anime.studio,
      ]}
      genres={anime.genres}
      description={anime.description}
      showProgress
      seriesId={anime.id}
      threadId={`anime:${anime.id}`}
      franchiseSeasons={franchiseSeasons}
      groups={seasons.map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        year: s.year,
        cover: s.cover,
        range: `Episodes ${s.episodes[0].episodeNumber}–${s.episodes[s.episodes.length - 1].episodeNumber}`,
        units: s.episodes.map((ep) => {
          const progress = episodeProgress(progressState, ep);
          return {
            id: ep.id,
            number: ep.episodeNumber,
            label: episodeLabel(anime, ep),
            title: ep.title,
            image: ep.thumbnail,
            href: `/watch/${anime.id}/${ep.id}`,
            length: `${ep.duration} min`,
            remaining: `${Math.max(1, Math.round(ep.duration * (1 - progress / 100)))} min left`,
            releasedAt: ep.releasedAt,
            progress,
            isNew: anime.status === "ONGOING" && ep === lastEpisode,
          };
        }),
      }))}
      extras={extras}
      related={
        related.length > 0 && (
          <ContentRow title="More like this">
            {related.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </ContentRow>
        )
      }
    />
  );
}

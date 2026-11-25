"use client";

import { SeriesPage } from "@/components/SeriesPage";
import { ContentRow } from "@/components/ContentRow";
import { AnimeCard } from "@/components/ContentCard";
import type { Anime, AnimeSummary, Episode } from "@/data/schema";
import { episodeLabel, getSeasons } from "@/data/series";
import { episodeProgress, useProgress } from "@/lib/progress";

import type { FranchiseSeason } from "@/server/details";

export function AnimeDetailsPage({
  anime,
  upcoming = [],
  related,
  franchiseSeasons,
  initialSeasonId,
  extras,
}: {
  anime: Anime;
  upcoming?: Episode[];
  related: AnimeSummary[];
  franchiseSeasons?: FranchiseSeason[];
  initialSeasonId?: string;
  extras?: React.ReactNode;
}) {
  const progressState = useProgress();
  const upcomingIds = new Set(upcoming.map((e) => e.id));
  const seasons = getSeasons({ ...anime, episodes: [...anime.episodes, ...upcoming] });
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
      initialSeasonId={initialSeasonId}
      threadId={`anime:${anime.id}`}
      franchiseSeasons={franchiseSeasons}
      groups={seasons.map((s) => {
        const matchingSeason = anime.seasons.find((as) => as.number === s.number);
        return {
          id: s.id,
          seasonNumber: s.number,
          seasonId: matchingSeason?.id,
          title: s.title,
          subtitle: s.subtitle,
          year: s.year,
          cover: s.cover,
          range: s.episodes.length ? `Episodes ${s.episodes[0].episodeNumber}–${s.episodes[s.episodes.length - 1].episodeNumber}` : "",
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
              upcoming: upcomingIds.has(ep.id),
              isNew: anime.status === "ONGOING" && ep === lastEpisode,
            };
          }),
        };
      })}
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

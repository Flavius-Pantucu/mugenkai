"use client";

import { useParams } from "next/navigation";
import { SeriesPage } from "@/components/SeriesPage";
import { ContentRow } from "@/components/ContentRow";
import { AnimeCard } from "@/components/ContentCard";
import { animeList, getSeasons, episodeLabel } from "@/data/mock-data";
import { episodeProgress, useProgress } from "@/lib/progress";
import { NotFoundPage } from "./NotFoundPage";

export function AnimeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const progressState = useProgress(); // before the early return: hooks run every render
  const anime = animeList.find((a) => a.id === id);
  if (!anime) return <NotFoundPage />;

  const seasons = getSeasons(anime);
  const lastEpisode = anime.episodes.at(-1);
  // Most shared genres first.
  const shared = (genres: string[]) => genres.filter((g) => anime.genres.includes(g)).length;
  const related = animeList
    .filter((a) => a.id !== anime.id && shared(a.genres) > 0)
    .sort((a, b) => shared(b.genres) - shared(a.genres) || b.popularity - a.popularity)
    .slice(0, 20);

  return (
    <SeriesPage
      kind="anime"
      title={anime.title}
      banner={anime.bannerImage}
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
      threadId={`anime:${anime.id}`}
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
            progress,
            isNew: anime.status === "ONGOING" && ep === lastEpisode,
          };
        }),
      }))}
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

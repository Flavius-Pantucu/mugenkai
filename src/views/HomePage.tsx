"use client";

import Link from "next/link";
import { HeroBanner, type HeroSlide } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { AnimeCard, MangaCard, ContinueReadingCard, ContinueWatchingCard } from "@/components/ContentCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { TrendingRow } from "@/components/TrendingRow";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import type { AnimeSummary, MangaSummary, ScheduleEntry, Trending } from "@/data/schema";
import { homeRows, parseChapterId, parseEpisodeId, similarTo } from "@/data/series";
import { useList } from "@/lib/list";
import { useAuth } from "@/context/AuthContext";
import { continueReading, continueWatching, useProgress } from "@/lib/progress";

export function HomePage({
  anime,
  manga,
  schedule,
  trending,
  hero,
}: {
  hero: HeroSlide[];
  anime: AnimeSummary[];
  manga: MangaSummary[];
  schedule: ScheduleEntry[];
  trending: Trending;
}) {
  const hasTrending = trending.day.length + trending.week.length + trending.month.length > 0;
  const { isAuthenticated } = useAuth();
  const progress = useProgress();
  const watching = continueWatching(progress, anime);
  const reading = continueReading(progress, manga);
  const list = useList();
  // Seeds: the show/manga most recently touched, else the newest list entry of that medium.
  const animeById = new Map(anime.map((a) => [a.id, a]));
  const mangaById = new Map(manga.map((m) => [m.id, m]));
  const seen = new Set([
    ...list.map((e) => e.seriesId),
    ...Object.keys(progress.episodes).map((id) => parseEpisodeId(id)?.animeId ?? ""),
    ...Object.keys(progress.chapters).map((id) => parseChapterId(id)?.mangaId ?? ""),
  ]);
  const animeSeed = watching[0]?.anime ?? list.map((e) => animeById.get(e.seriesId)).find((a) => a !== undefined);
  const mangaSeed = reading[0]?.manga ?? list.map((e) => mangaById.get(e.seriesId)).find((m) => m !== undefined);
  const forAnime = animeSeed ? similarTo(animeSeed, anime, seen) : [];
  const forManga = mangaSeed ? similarTo(mangaSeed, manga, seen) : [];
  const { trendingAnime, popularAnime, topRatedAnime, newReleases, trendingManga, popularManga, topRatedManga } = homeRows(anime, manga);

  return (
    <div className="min-h-screen bg-ink">
      {hero.length > 0 && <HeroBanner slides={hero} />}

      <div className="relative z-10 space-y-10 bg-ink pb-20 pt-8 sm:space-y-12">
        {watching.length > 0 && (
          <ContentRow title="Continue watching" subtitle="Pick up where you left off">
            {watching.map((w) => (
              <ContinueWatchingCard key={w.anime.id} item={w} />
            ))}
          </ContentRow>
        )}

        {reading.length > 0 && (
          <ContentRow title="Continue reading" subtitle="Back to your page">
            {reading.map((r) => (
              <ContinueReadingCard key={r.manga.id} item={r} />
            ))}
          </ContentRow>
        )}

        {animeSeed && forAnime.length > 0 && (
          <ContentRow title={`Because you watched ${animeSeed.title}`} subtitle="Same genres, not started yet">
            {forAnime.map((a) => (
              <AnimeCard key={`for-${a.id}`} anime={a} />
            ))}
          </ContentRow>
        )}

        {mangaSeed && forManga.length > 0 && (
          <ContentRow title={`Because you read ${mangaSeed.title}`} subtitle="Same genres, not started yet">
            {forManga.map((m) => (
              <MangaCard key={`for-${m.id}`} manga={m} />
            ))}
          </ContentRow>
        )}

        {hasTrending ? (
          <TrendingRow trending={trending} />
        ) : (
          // AniList unreachable: fall back to the catalog's own ranking.
          <ContentRow title="Trending anime" subtitle="Most watched right now" href="/anime">
            {trendingAnime.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </ContentRow>
        )}

        <WeeklySchedule entries={schedule} />

        <ContentRow title="Ongoing manga" subtitle="Still publishing" href="/manga">
          {trendingManga.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </ContentRow>

        {!isAuthenticated && <JoinBand covers={[anime[1], manga[1], anime[3], manga[3], anime[5]].filter((c) => c !== undefined)} />}

        <ContentRow title="Top rated anime" subtitle="Highest scores of all time" href="/anime">
          {topRatedAnime.map((a) => (
            <AnimeCard key={`top-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Recent seasons" subtitle="Newest first">
          {newReleases.map((a) => (
            <AnimeCard key={`new-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Most popular manga" href="/manga">
          {popularManga.map((m) => (
            <MangaCard key={`pop-${m.id}`} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="Most popular anime" href="/anime">
          {popularAnime.map((a) => (
            <AnimeCard key={`pop-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Top rated manga" href="/manga">
          {topRatedManga.map((m) => (
            <MangaCard key={`top-${m.id}`} manga={m} />
          ))}
        </ContentRow>
      </div>

      <Footer />
    </div>
  );
}

function JoinBand({ covers }: { covers: { id: string; coverImage: string }[] }) {
  return (
    <section className="mx-auto w-[90%]">
      <div className="relative overflow-hidden rounded-2xl bg-lagoon-950 ring-1 ring-lagoon-800/60">
        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-10 md:max-w-[55%]">
          <h2
            className="text-balance text-white"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.4rem, 2.4vw, 2rem)", fontWeight: 900, lineHeight: 1.1 }}
          >
            Every episode and chapter, one history.
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-lagoon-100/80">
            Make a free account to keep your place across anime and manga, and come back to exactly where you stopped.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button asChild size="lg">
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-lagoon-700 bg-transparent text-lagoon-100 hover:bg-lagoon-900">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        {/* Fanned covers on the right; decorative, hidden on phones. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] md:block">
          <div className="absolute inset-0 flex items-center justify-end gap-3 pr-10">
            {covers.map((c, i) => (
              <img
                key={c.id}
                src={c.coverImage}
                alt=""
                className="aspect-[2/3] w-[18%] rounded-lg object-cover shadow-[0_18px_40px_-14px_rgba(0,0,0,0.9)]"
                style={{ transform: `translateY(${[18, -10, 6, -16, 12][i]}px) rotate(${[-4, 2, -1, 3, -2][i]}deg)` }}
              />
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-lagoon-950 to-transparent" />
        </div>
      </div>
    </section>
  );
}

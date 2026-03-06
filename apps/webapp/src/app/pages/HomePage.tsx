import { useState, useEffect } from "react";
import { HeroBanner } from "../components/HeroBanner";
import { ContentRow } from "../components/ContentRow";
import { AnimeCard, MangaCard, ContinueWatchingCard } from "../components/ContentCard";
import { PageSkeleton } from "../components/SkeletonLoader";
import { Footer } from "../components/Footer";
import {
  animeList,
  mangaList,
  trendingAnime,
  popularAnime,
  newReleases,
  trendingManga,
  popularManga,
  continueWatching,
} from "../data/mock-data";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageSkeleton />;

  const heroItems = [animeList[2], animeList[0], animeList[4], animeList[5]];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <HeroBanner items={heroItems} />

      <div className="relative z-10 -mt-20 space-y-6 pb-8">
        {isAuthenticated && continueWatching.length > 0 && (
          <ContentRow title="Continue Watching" subtitle="Pick up where you left off" accentColor="#06b6d4">
            {continueWatching.map((h) => (
              <ContinueWatchingCard key={h.id} history={h} />
            ))}
          </ContentRow>
        )}

        <ContentRow title="Trending Anime" subtitle="Most watched this week" accentColor="#8b5cf6">
          {trendingAnime.map((a) => (
            <AnimeCard key={a.id} anime={a} />
          ))}
          {newReleases.map((a) => (
            <AnimeCard key={`nr-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Popular Anime" subtitle="All-time favorites" accentColor="#ec4899">
          {popularAnime.map((a) => (
            <AnimeCard key={a.id} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Trending Manga" subtitle="Top manga picks" accentColor="#f59e0b">
          {trendingManga.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
          {popularManga.map((m) => (
            <MangaCard key={`pm-${m.id}`} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="New Releases" subtitle="Fresh episodes & chapters" accentColor="#10b981">
          {newReleases.map((a) => (
            <AnimeCard key={`new-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="All Anime" accentColor="#8b5cf6">
          {animeList.map((a) => (
            <AnimeCard key={`all-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="All Manga" accentColor="#7c3aed">
          {mangaList.map((m) => (
            <MangaCard key={`all-${m.id}`} manga={m} />
          ))}
        </ContentRow>
      </div>

      <Footer />
    </div>
  );
}

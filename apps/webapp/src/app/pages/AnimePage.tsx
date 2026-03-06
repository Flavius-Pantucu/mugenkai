import { useState, useEffect } from "react";
import { ContentRow } from "../components/ContentRow";
import { AnimeCard } from "../components/ContentCard";
import { PageSkeleton } from "../components/SkeletonLoader";
import { Footer } from "../components/Footer";
import {
  animeList,
  trendingAnime,
  popularAnime,
  newReleases,
} from "../data/mock-data";

export function AnimePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#09090b] pt-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-transparent to-transparent" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-4">
            <h1
              className="text-white"
              style={{
                fontSize: "48px",
                fontWeight: 800,
                fontFamily: "var(--font-family-heading)",
              }}
            >
              Anime Collection
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto" style={{ fontSize: "18px" }}>
              Discover thousands of anime series from classic titles to the latest releases
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-6 pb-8">
        <ContentRow title="Trending Now" subtitle="Most watched this week" accentColor="#8b5cf6">
          {trendingAnime.map((a) => (
            <AnimeCard key={a.id} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Popular Anime" subtitle="All-time favorites" accentColor="#ec4899">
          {popularAnime.map((a) => (
            <AnimeCard key={a.id} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="New Releases" subtitle="Fresh episodes added" accentColor="#10b981">
          {newReleases.map((a) => (
            <AnimeCard key={a.id} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Action Anime" accentColor="#f59e0b">
          {animeList.filter((a) => a.genres.includes("Action")).map((a) => (
            <AnimeCard key={`action-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="Adventure" accentColor="#06b6d4">
          {animeList.filter((a) => a.genres.includes("Adventure")).map((a) => (
            <AnimeCard key={`adventure-${a.id}`} anime={a} />
          ))}
        </ContentRow>

        <ContentRow title="All Anime" accentColor="#8b5cf6">
          {animeList.map((a) => (
            <AnimeCard key={`all-${a.id}`} anime={a} />
          ))}
        </ContentRow>
      </div>

      <Footer />
    </div>
  );
}

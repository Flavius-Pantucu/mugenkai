import React, { useState, useEffect } from "react";
import { ContentRow } from "../components/ContentRow";
import { MangaCard } from "../components/ContentCard";
import { PageSkeleton } from "../components/SkeletonLoader";
import { Footer } from "../components/Footer";
import {
  mangaList,
  trendingManga,
  popularManga,
} from "../data/mock-data";

export function MangaPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-[#09090b] pt-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600/20 via-transparent to-transparent" />
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
              Manga Library
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto" style={{ fontSize: "18px" }}>
              Explore an extensive collection of manga from classic series to the latest chapters
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-6 pb-8">
        <ContentRow title="Trending Now" subtitle="Most popular this week" accentColor="#f59e0b">
          {trendingManga.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="Popular Manga" subtitle="Reader favorites" accentColor="#ec4899">
          {popularManga.map((m) => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="Action Manga" accentColor="#ef4444">
          {mangaList.filter((m) => m.genres.includes("Action")).map((m) => (
            <MangaCard key={`action-${m.id}`} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="Fantasy" accentColor="#8b5cf6">
          {mangaList.filter((m) => m.genres.includes("Fantasy")).map((m) => (
            <MangaCard key={`fantasy-${m.id}`} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="Romance" accentColor="#ec4899">
          {mangaList.filter((m) => m.genres.includes("Romance")).map((m) => (
            <MangaCard key={`romance-${m.id}`} manga={m} />
          ))}
        </ContentRow>

        <ContentRow title="All Manga" accentColor="#f59e0b">
          {mangaList.map((m) => (
            <MangaCard key={`all-${m.id}`} manga={m} />
          ))}
        </ContentRow>
      </div>

      <Footer />
    </div>
  );
}

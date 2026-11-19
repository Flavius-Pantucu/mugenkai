"use client";

import { CatalogBrowser } from "@/components/CatalogBrowser";
import { AnimeCard } from "@/components/ContentCard";
import { animeList } from "@/data/mock-data";

export function AnimePage() {
  return <CatalogBrowser title="Anime" noun="anime" items={animeList} renderItem={(a) => <AnimeCard anime={a} fluid />} />;
}

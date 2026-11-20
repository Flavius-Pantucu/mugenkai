"use client";

import { CatalogBrowser } from "@/components/CatalogBrowser";
import { AnimeCard } from "@/components/ContentCard";
import type { AnimeSummary } from "@/data/schema";

export function AnimePage({ items }: { items: AnimeSummary[] }) {
  return <CatalogBrowser title="Anime" noun="anime" items={items} renderItem={(a) => <AnimeCard anime={a} fluid />} />;
}

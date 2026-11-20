"use client";

import { CatalogBrowser } from "@/components/CatalogBrowser";
import { MangaCard } from "@/components/ContentCard";
import type { MangaSummary } from "@/data/schema";

export function MangaPage({ items }: { items: MangaSummary[] }) {
  return <CatalogBrowser title="Manga" noun="manga" items={items} renderItem={(m) => <MangaCard manga={m} fluid />} />;
}

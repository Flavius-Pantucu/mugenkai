"use client";

import { CatalogBrowser } from "@/components/CatalogBrowser";
import { MangaCard } from "@/components/ContentCard";
import { mangaList } from "@/data/mock-data";

export function MangaPage() {
  return <CatalogBrowser title="Manga" noun="manga" items={mangaList} renderItem={(m) => <MangaCard manga={m} fluid />} />;
}

import { connection } from "next/server";
import type { HeroSlide } from "@/components/HeroBanner";
import type { AnimeSummary, MangaSummary } from "@/data/schema";
import { getCatalog } from "@/server/catalog";
import { getWeekSchedule } from "@/server/schedule";
import { getSiteConfig } from "@/server/site-config";
import { getTrending } from "@/server/trending";
import { HomePage } from "@/views/HomePage";

const POOL = 40; // draw from this many of the most popular titles of each kind
const PER_KIND = 3;

/** `n` random items, Fisher-Yates on a copy. */
function sample<T>(list: T[], n: number) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/**
 * Hero: 3 anime and 3 manga, alternating, picked at random on every visit from the most popular.
 * Titles with real banner art first (a missing banner falls back to the cover, which crops badly).
 */
function heroSlides(
  anime: AnimeSummary[],
  manga: MangaSummary[],
  heroMode: "auto" | "pinned" | "mixed",
  pinnedIds: string[],
): HeroSlide[] {
  const animeById = new Map(anime.map((a) => [a.id, a]));
  const mangaById = new Map(manga.map((m) => [m.id, m]));
  const pinned: HeroSlide[] = [];
  for (const id of pinnedIds) {
    const a = animeById.get(id);
    if (a) pinned.push({ kind: "anime", item: a });
    else {
      const m = mangaById.get(id);
      if (m) pinned.push({ kind: "manga", item: m });
    }
  }

  if (heroMode === "pinned" && pinned.length > 0) return pinned;

  const pool = <T extends { popularity: number; bannerImage: string; coverImage: string }>(list: T[]) => {
    const top = [...list].sort((a, b) => b.popularity - a.popularity).slice(0, POOL);
    const withBanner = top.filter((x) => x.bannerImage !== x.coverImage);
    return withBanner.length >= PER_KIND ? withBanner : top;
  };
  const a = sample(pool(anime), PER_KIND);
  const m = sample(pool(manga), PER_KIND);
  const auto = Array.from({ length: Math.max(a.length, m.length) }, (_, i): HeroSlide[] => [
    ...(a[i] ? [{ kind: "anime" as const, item: a[i] }] : []),
    ...(m[i] ? [{ kind: "manga" as const, item: m[i] }] : []),
  ]).flat();

  if (heroMode === "mixed" && pinned.length > 0) {
    const seen = new Set(pinned.map((s) => s.item.id));
    return [...pinned, ...auto.filter((s) => !seen.has(s.item.id))].slice(0, 6);
  }
  return auto;
}

export default async function Page() {
  await connection(); // per request, so each visit gets a fresh hero (also in demo mode)
  const [catalog, siteConfig] = await Promise.all([getCatalog(), getSiteConfig()]);
  const [schedule, trending] = await Promise.all([getWeekSchedule(catalog), getTrending(catalog)]);
  return (
    <HomePage
      hero={heroSlides(catalog.anime, catalog.manga, siteConfig.heroMode, siteConfig.pinnedHeroIds)}
      anime={catalog.anime}
      manga={catalog.manga}
      schedule={schedule}
      trending={trending}
    />
  );
}

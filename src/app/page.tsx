import { connection } from "next/server";
import type { HeroSlide } from "@/components/HeroBanner";
import type { AnimeSummary, MangaSummary } from "@/data/schema";
import { getCatalog } from "@/server/catalog";
import { getWeekSchedule } from "@/server/schedule";
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
function heroSlides(anime: AnimeSummary[], manga: MangaSummary[]): HeroSlide[] {
  const pool = <T extends { popularity: number; bannerImage: string; coverImage: string }>(list: T[]) => {
    const top = [...list].sort((a, b) => b.popularity - a.popularity).slice(0, POOL);
    const withBanner = top.filter((x) => x.bannerImage !== x.coverImage);
    return withBanner.length >= PER_KIND ? withBanner : top;
  };
  const a = sample(pool(anime), PER_KIND);
  const m = sample(pool(manga), PER_KIND);
  return Array.from({ length: Math.max(a.length, m.length) }, (_, i): HeroSlide[] => [
    ...(a[i] ? [{ kind: "anime" as const, item: a[i] }] : []),
    ...(m[i] ? [{ kind: "manga" as const, item: m[i] }] : []),
  ]).flat();
}

export default async function Page() {
  await connection(); // per request, so each visit gets a fresh hero (also in demo mode)
  const catalog = await getCatalog();
  const [schedule, trending] = await Promise.all([getWeekSchedule(catalog), getTrending(catalog)]);
  return (
    <HomePage
      hero={heroSlides(catalog.anime, catalog.manga)}
      anime={catalog.anime}
      manga={catalog.manga}
      schedule={schedule}
      trending={trending}
    />
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Search, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Status } from "@/data/schema";
import { Footer } from "./Footer";
import { ResponsiveArt } from "./ResponsiveArt";

interface CatalogItem {
  id: string;
  title: string;
  nativeTitle: string;
  bannerImage: string;
  coverImage: string;
  rating: number;
  popularity: number;
  year: number;
  status: Status;
  genres: string[];
}

type Sort = "popular" | "rating" | "newest" | "title";
type StatusFilter = Status | "ALL";

interface CatalogBrowserProps<T extends CatalogItem> {
  title: string;
  noun: string; // "anime" | "manga"
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

const SORTS: Record<Sort, { label: string; compare: (a: CatalogItem, b: CatalogItem) => number }> = {
  popular: { label: "Most popular", compare: (a, b) => b.popularity - a.popularity },
  rating: { label: "Top rated", compare: (a, b) => b.rating - a.rating },
  newest: { label: "Newest", compare: (a, b) => b.year - a.year },
  title: { label: "A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
};

// Decades and score floors for the extra filters. "any" = no filter.
const ERAS: Record<string, { label: string; test: (year: number) => boolean }> = {
  any: { label: "Any year", test: () => true },
  "2020": { label: "2020s", test: (y) => y >= 2020 },
  "2010": { label: "2010s", test: (y) => y >= 2010 && y < 2020 },
  "2000": { label: "2000s", test: (y) => y >= 2000 && y < 2010 },
  "1990": { label: "1990s", test: (y) => y >= 1990 && y < 2000 },
  older: { label: "Before 1990", test: (y) => y < 1990 },
};
const SCORES: Record<string, { label: string; min: number }> = {
  any: { label: "Any score", min: 0 },
  "8": { label: "8+", min: 8 },
  "7": { label: "7+", min: 7 },
  "6": { label: "6+", min: 6 },
};
const PAGE = 48; // grid items rendered per step of the infinite scroll

interface RemoteSearchResult {
  id: string;
  type: "ANIME" | "MANGA";
  title: string;
  nativeTitle: string;
  cover: string;
  href: string;
  meta: string;
  rating: number;
}

const isSort = (v: string): v is Sort => v in SORTS;
const isStatus = (v: string): v is StatusFilter => v === "ALL" || v === "ONGOING" || v === "COMPLETED";

export function CatalogBrowser<T extends CatalogItem>({ title, noun, items, renderItem }: CatalogBrowserProps<T>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [genres, setGenres] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("popular");
  const [era, setEra] = useState("any");
  const [score, setScore] = useState("any");
  const [shown, setShown] = useState(PAGE);
  const [remoteResults, setRemoteResults] = useState<RemoteSearchResult[]>([]);
  const [searchingRemote, setSearchingRemote] = useState(false);

  // Global search fallback via /api/search (local SearchEntry + live AniList) whenever query >= 2 chars
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemoteResults([]);
      setSearchingRemote(false);
      return;
    }

    const ctrl = new AbortController();
    setSearchingRemote(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${noun.toUpperCase()}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { results?: RemoteSearchResult[] };
        setRemoteResults(data.results ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setRemoteResults([]);
      } finally {
        if (!ctrl.signal.aborted) setSearchingRemote(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, noun]);

  // Genres actually present, most common first.
  const genreOptions = useMemo(() => {
    const count = new Map<string, number>();
    items.forEach((i) => i.genres.forEach((g) => count.set(g, (count.get(g) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([g]) => g);
  }, [items]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(
        (i) =>
          (!q || i.title.toLowerCase().includes(q) || i.nativeTitle.toLowerCase().includes(q)) &&
          (status === "ALL" || i.status === status) &&
          genres.every((g) => i.genres.includes(g)) &&
          ERAS[era].test(i.year) &&
          i.rating >= SCORES[score].min,
      )
      .sort(SORTS[sort].compare);
  }, [items, query, status, genres, sort, era, score]);

  const localIds = useMemo(() => new Set(results.map((r) => r.id)), [results]);
  const extraRemote = useMemo(
    () =>
      query.trim().length >= 2 && status === "ALL" && genres.length === 0 && era === "any" && score === "any"
        ? remoteResults.filter((r) => !localIds.has(r.id))
        : [],
    [query, status, genres.length, era, score, remoteResults, localIds],
  );
  const totalMatches = results.length + extraRemote.length;

  const filtered = query !== "" || status !== "ALL" || genres.length > 0 || era !== "any" || score !== "any";
  const clear = () => {
    setQuery("");
    setStatus("ALL");
    setGenres([]);
    setEra("any");
    setScore("any");
  };

  // Infinite scroll: a sentinel under the grid renders the next page as it nears the viewport.
  useEffect(() => setShown(PAGE), [results]);
  const sentinel = useRef<HTMLDivElement>(null);
  const more = results.length > shown;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((n) => n + PAGE), { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, shown]);

  // Wallpaper: banner of the most popular title, fading into the page.
  // Random pick from the 15 most popular, chosen after mount so server and client HTML match.
  const [wallpaper, setWallpaper] = useState<{ banner: string; cover: string }>();
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false);
  useEffect(() => {
    const top = [...items].sort(SORTS.popular.compare).slice(0, 15);
    const pick = top[Math.floor(Math.random() * top.length)];
    if (pick) setWallpaper({ banner: pick.bannerImage, cover: pick.coverImage });
  }, [items]);

  // Filter bar is see-through over the wallpaper; it gets a backdrop only once it sticks under the navbar.
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck((barRef.current?.getBoundingClientRect().top ?? 1e9) <= 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      {wallpaper && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]">
          <ResponsiveArt
            banner={wallpaper.banner}
            cover={wallpaper.cover}
            onLoad={() => setWallpaperLoaded(true)}
            className={`h-full w-full object-cover object-top transition-opacity duration-700 ${wallpaperLoaded ? "opacity-45" : "opacity-0"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/75 to-ink" />
        </div>
      )}

      <main className="relative mx-auto w-[90%] pb-20 pt-24">
        <h1 className="flex flex-wrap items-baseline gap-x-3">
          <span
            className="text-white"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.9rem, 3vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.02em" }}
          >
            {title}
          </span>
          <span className="text-[14px] tabular-nums text-muted-foreground">
            {filtered ? `${totalMatches} ${totalMatches === 1 ? "title" : "titles"} found` : `${items.length} titles`}
            {searchingRemote && (
              <span className="ml-2 inline-flex items-center gap-1 text-lagoon-300">
                <Loader2 className="size-3.5 animate-spin" />
                Searching all {noun}…
              </span>
            )}
          </span>
        </h1>

        {/* Filters stay reachable while scrolling the grid. */}
        <div
          ref={barRef}
          className={`sticky top-16 z-30 mt-5 py-3 transition-colors duration-300 ${stuck ? "bg-ink/90 backdrop-blur-md" : "bg-transparent"}`}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Label htmlFor="catalog-search" className="sr-only">
                Search {noun}
              </Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="catalog-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${noun} by title`}
                className="h-10 bg-ink-raised pl-9 pr-9"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                >
                  <X />
                </Button>
              )}
            </div>

            <ToggleGroup
              type="single"
              variant="outline"
              value={status}
              onValueChange={(v) => isStatus(v) && setStatus(v)}
              aria-label="Status"
              className="bg-ink-raised"
            >
              <ToggleGroupItem value="ALL" className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="ONGOING" className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Ongoing
              </ToggleGroupItem>
              <ToggleGroupItem value="COMPLETED" className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Completed
              </ToggleGroupItem>
            </ToggleGroup>

            <GenrePicker options={genreOptions} value={genres} onChange={setGenres} />

            <Select value={era} onValueChange={setEra}>
              <SelectTrigger aria-label="Year" className="w-[130px] bg-ink-raised">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ERAS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={score} onValueChange={setScore}>
              <SelectTrigger aria-label="Minimum score" className="w-[120px] bg-ink-raised">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCORES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="catalog-sort" className="text-[13px] font-normal text-muted-foreground">
                Sort
              </Label>
              <Select value={sort} onValueChange={(v) => isSort(v) && setSort(v)}>
                <SelectTrigger id="catalog-sort" className="w-[150px] bg-ink-raised">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORTS) as Sort[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SORTS[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters as removable badges; nothing shows when no genre is picked. */}
          {filtered && genres.length === 0 && (era !== "any" || score !== "any") && (
            <div className="mt-3">
              <Button variant="link" size="sm" onClick={clear} className="h-auto px-1">
                Clear all filters
              </Button>
            </div>
          )}
          {genres.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {genres.map((g) => (
                <Badge key={g} variant="outline" className="gap-1 border-primary/40 bg-primary/10 py-1 pl-2.5 pr-1 text-lagoon-200">
                  {g}
                  <button
                    onClick={() => setGenres((cur) => cur.filter((x) => x !== g))}
                    aria-label={`Remove ${g}`}
                    className="rounded-full p-0.5 hover:bg-white/10"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="link" size="sm" onClick={clear} className="h-auto px-1">
                Clear all
              </Button>
            </div>
          )}
        </div>

        {totalMatches === 0 && !searchingRemote ? (
          <Card className="mt-10 bg-transparent text-center">
            <CardContent className="py-10">
              <p className="text-[15px] text-zinc-200">No {noun} matches these filters.</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Try fewer filters or a different search term.
              </p>
              <Button onClick={clear} className="mt-4">
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {results.slice(0, shown).map((i) => (
                <li key={i.id}>{renderItem(i)}</li>
              ))}
              {!more &&
                extraRemote.map((r) => (
                  <li key={`remote-${r.id}`}>
                    <Link href={r.href} className="group block">
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02] group-hover:ring-lagoon-400/50">
                        {r.cover && <img src={r.cover} alt={r.title} className="h-full w-full object-cover" loading="lazy" />}
                        {r.rating > 0 && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-ink/85 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-300 backdrop-blur-sm">
                            <Star className="size-3 fill-current" />
                            {r.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-zinc-100 group-hover:text-lagoon-300">
                        {r.title}
                      </p>
                      {r.meta && <p className="mt-0.5 truncate text-[11px] text-zinc-400">{r.meta}</p>}
                    </Link>
                  </li>
                ))}
            </ul>
            {more && (
              <div ref={sentinel} className="mt-10 flex justify-center">
                <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                  Show more
                  <span className="text-muted-foreground">· {results.length - shown} left</span>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** Searchable multi-select of genres in a popover; the trigger shows how many are picked. */
function GenrePicker({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (g: string) => onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-ink-raised">
          Genres
          {value.length > 0 && <Badge className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">{value.length}</Badge>}
          <ChevronDown className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Find a genre…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No genre found.</CommandEmpty>
            <CommandGroup>
              {options.map((g) => {
                const on = value.includes(g);
                return (
                  <CommandItem key={g} value={g} onSelect={() => toggle(g)}>
                    <span
                      className={`grid size-4 place-items-center rounded-sm border ${on ? "border-primary bg-primary text-primary-foreground" : "border-white/25"}`}
                    >
                      {on && <Check className="!size-3" />}
                    </span>
                    {g}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {value.length > 0 && (
            <div className="border-t border-white/10 p-1">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
                Clear genres
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, History, Loader2, Search, Star, Tv } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { SearchIndex, SearchResult as Result } from "@/data/series";
import { createLocalStore } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const RecentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  cover: z.string(),
  href: z.string(),
  meta: z.string(),
  rating: z.number(),
  type: z.enum(["ANIME", "MANGA"]).optional(),
  keywords: z.array(z.string()).optional(),
});
type RecentItem = z.infer<typeof RecentItemSchema>;

const RecentListSchema = z.array(z.union([z.string(), RecentItemSchema])).max(20);

// Last few titles opened from search, newest first (per device)
const recentStore = createLocalStore("mugenkai:recent-search-v2", RecentListSchema, []);

interface LiveSearchResult {
  id: string;
  type: "ANIME" | "MANGA";
  title: string;
  nativeTitle: string;
  cover: string;
  href: string;
  meta: string;
  rating: number;
}

/** Substring match for offline index. Title prefix ranks first. */
function matchScore(value: string, search: string, keywords: string[] = []) {
  const q = search.trim().toLowerCase();
  const title = value.split("​")[0].toLowerCase();
  if (title.startsWith(q)) return 1;
  if (title.includes(q)) return 0.8;
  return keywords.some((k) => k.toLowerCase().includes(q)) ? 0.4 : 0;
}

export type SearchFilterType = "ALL" | "ANIME" | "MANGA";

/** Search button that opens a command palette over titles, native titles, authors and genres. ⌘K / Ctrl+K or "/" opens it. */
export function NavSearch({ index: { anime, manga } }: { index: SearchIndex }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<SearchFilterType>("ALL");
  const [liveResults, setLiveResults] = useState<LiveSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const recentRaw = recentStore.useValue();
  const byId = new Map([...anime, ...manga].map((r) => [r.id, r]));

  const recent: RecentItem[] = recentRaw
    .map((item) => {
      if (typeof item === "string") {
        const fromIndex = byId.get(item);
        if (!fromIndex) return null;
        return {
          id: fromIndex.id,
          title: fromIndex.title,
          cover: fromIndex.cover,
          href: fromIndex.href,
          meta: fromIndex.meta,
          rating: fromIndex.rating,
          keywords: fromIndex.keywords,
          type: anime.some((a) => a.id === fromIndex.id) ? "ANIME" : "MANGA",
        };
      }
      return item;
    })
    .filter(Boolean) as RecentItem[];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target;
        if (t instanceof HTMLElement && t.closest("input, textarea, select, [contenteditable=true]")) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Server search once 2+ characters are typed
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLiveResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&type=${filterType}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          setLiveResults(json.results || []);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("[NavSearch] search error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, filterType]);

  const go = (r: { id: string; title: string; cover: string; href: string; meta: string; rating: number; type?: "ANIME" | "MANGA"; keywords?: string[] }) => {
    const itemToStore: RecentItem = {
      id: r.id,
      title: r.title,
      cover: r.cover,
      href: r.href,
      meta: r.meta,
      rating: r.rating,
      type: r.type,
      keywords: r.keywords,
    };
    recentStore.write((prev) => [itemToStore, ...prev.filter((p) => (typeof p === "string" ? p !== r.id : p.id !== r.id))].slice(0, 20));
    setOpen(false);
    setQuery("");
    router.push(r.href);
  };

  const isLive = query.trim().length >= 2;
  // Catalog matches shown instantly while the server answers.
  const shown: LiveSearchResult[] =
    liveResults.length > 0 || !loading
      ? liveResults
      : [
          ...(filterType === "MANGA" ? [] : anime.map((r) => ({ ...r, type: "ANIME" as const }))),
          ...(filterType === "ANIME" ? [] : manga.map((r) => ({ ...r, type: "MANGA" as const }))),
        ]
          .filter((r) => matchScore(r.title, query, r.keywords) > 0)
          .slice(0, 8)
          .map((r) => ({ ...r, nativeTitle: r.title }));

  const filteredRecent = recent
    .filter((r) => {
      if (filterType === "ANIME") return r.type === "ANIME" || !r.type;
      if (filterType === "MANGA") return r.type === "MANGA" || !r.type;
      return true;
    })
    .slice(0, 5);

  const group = (
    heading: string,
    items: Array<{ id: string; title: string; cover: string; href: string; meta: string; rating: number; type?: "ANIME" | "MANGA"; keywords?: string[] }>,
    prefix = ""
  ) => (
    <CommandGroup heading={heading}>
      {items.map((r) => (
        <CommandItem
          key={r.id}
          value={`${r.title}​${prefix}${r.id}`}
          keywords={r.keywords}
          onSelect={() => go(r)}
          className="gap-3 cursor-pointer py-2.5"
        >
          {prefix && <History className="text-muted-foreground size-4 shrink-0" />}
          <img src={r.cover} alt="" className="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-white/10" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="block truncate text-[14px] font-medium text-foreground">{r.title}</span>
              {r.type && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase border-white/20 text-zinc-300 font-normal shrink-0">
                  {r.type}
                </Badge>
              )}
            </span>
            <span className="block truncate text-[12px] text-muted-foreground">{r.meta}</span>
          </span>
          <CommandShortcut className="flex items-center gap-1 tracking-normal shrink-0">
            {r.rating > 0 && (
              <>
                <Star className="!size-3 fill-coral-400 text-coral-400" />
                {r.rating.toFixed(1)}
              </>
            )}
          </CommandShortcut>
        </CommandItem>
      ))}
    </CommandGroup>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Search anime and manga"
        title="Search (/)"
        className="size-10 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
      >
        <Search className="size-5" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setQuery("");
            setLiveResults([]);
          }
        }}
        title="Search anime and manga"
        description="Search every anime and manga"
        filter={isLive ? () => 1 : matchScore}
      >
        {/* Search Type Filter Buttons */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-zinc-900/60">
          <span className="text-[12px] text-zinc-400 mr-1 font-medium">Search:</span>
          {(
            [
              { id: "ALL", label: "All", icon: null },
              { id: "ANIME", label: "Anime", icon: Tv },
              { id: "MANGA", label: "Manga", icon: BookOpen },
            ] as const
          ).map((mode) => {
            const Icon = mode.icon;
            const active = filterType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setFilterType(mode.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  active
                    ? "bg-coral-500/20 text-coral-400 border border-coral-500/40 shadow-xs"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                )}
              >
                {Icon && <Icon className="size-3" />}
                {mode.label}
              </button>
            );
          })}
          {loading && (
            <div className="flex items-center gap-1.5 ml-auto text-xs text-coral-400">
              <Loader2 className="size-3.5 animate-spin" />
              <span className="hidden sm:inline">Searching…</span>
            </div>
          )}
        </div>

        <CommandInput
          placeholder={
            filterType === "ANIME"
              ? "Search all anime…"
              : filterType === "MANGA"
              ? "Search all manga…"
              : "Search all anime & manga…"
          }
          autoFocus
          value={query}
          onValueChange={setQuery}
        />

        <CommandList className="max-h-[min(60vh,520px)]">
          {isLive ? (
            <>
              {!loading && shown.length === 0 ? (
                <CommandEmpty>No results for &ldquo;{query}&rdquo;.</CommandEmpty>
              ) : (
                <>
                  {filterType === "ALL" ? (
                    <>
                      {shown.some((r) => r.type === "ANIME") && group("Anime", shown.filter((r) => r.type === "ANIME"))}
                      {shown.some((r) => r.type === "MANGA") && group("Manga", shown.filter((r) => r.type === "MANGA"))}
                    </>
                  ) : (
                    group(filterType === "ANIME" ? "Anime" : "Manga", shown)
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
              {filteredRecent.length > 0 && group("Recent", filteredRecent, "recent:")}
              {(filterType === "ALL" || filterType === "ANIME") && group("Popular Anime", anime.slice(0, 15))}
              {(filterType === "ALL" || filterType === "MANGA") && group("Popular Manga", manga.slice(0, 15))}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

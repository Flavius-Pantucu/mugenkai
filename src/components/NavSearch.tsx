"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Search, Star } from "lucide-react";
import { z } from "zod";
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

// Last few titles opened from search, newest first (per device).
const recentStore = createLocalStore("mugenkai:recent-search", z.array(z.string()).max(20), []);

/** Substring match (cmdk's default is fuzzy, which matched "berserk" to unrelated titles). Title prefix ranks first. */
function matchScore(value: string, search: string, keywords: string[] = []) {
  const q = search.trim().toLowerCase();
  const title = value.split("​")[0].toLowerCase(); // value is "title<zero-width space>id"
  if (title.startsWith(q)) return 1;
  if (title.includes(q)) return 0.8;
  return keywords.some((k) => k.toLowerCase().includes(q)) ? 0.4 : 0;
}

/** Search button that opens a command palette over titles, native titles, authors and genres. ⌘K / Ctrl+K or "/" opens it. */
export function NavSearch({ index: { anime, manga } }: { index: SearchIndex }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const recentIds = recentStore.useValue();
  const byId = new Map([...anime, ...manga].map((r) => [r.id, r]));
  const recent = recentIds.flatMap((id) => byId.get(id) ?? []).slice(0, 5);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Autofill dispatches keydown events with no `key`.
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

  const go = (r: Result) => {
    recentStore.write((ids) => [r.id, ...ids.filter((id) => id !== r.id)].slice(0, 20));
    setOpen(false);
    setQuery("");
    router.push(r.href);
  };

  const group = (heading: string, items: Result[], prefix = "") => (
    <CommandGroup heading={heading}>
      {items.map((r) => (
        <CommandItem key={r.id} value={`${r.title}​${prefix}${r.id}`} keywords={r.keywords} onSelect={() => go(r)} className="gap-3">
          {prefix && <History className="text-muted-foreground" />}
          <img src={r.cover} alt="" className="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-white/10" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] text-foreground">{r.title}</span>
            <span className="block truncate text-[12px] text-muted-foreground">{r.meta}</span>
          </span>
          <CommandShortcut className="flex items-center gap-1 tracking-normal">
            <Star className="!size-3 fill-coral-400 text-coral-400" />
            {r.rating.toFixed(1)}
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
          if (!o) setQuery("");
        }}
        title="Search anime and manga" description="Titles, authors, studios and genres" filter={matchScore}>
        <CommandInput placeholder="Search titles, authors, genres…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[min(60vh,520px)]">
          <CommandEmpty>Nothing matches. Try a shorter title or a genre like Fantasy.</CommandEmpty>
          {query.trim() === "" && recent.length > 0 && group("Recent", recent, "recent:")}
          {group("Anime", anime)}
          {group("Manga", manga)}
        </CommandList>
      </CommandDialog>
    </>
  );
}

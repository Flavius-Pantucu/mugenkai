"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star } from "lucide-react";
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
import { animeList, mangaList } from "@/data/mock-data";

interface Result {
  id: string;
  title: string;
  cover: string;
  href: string;
  meta: string;
  keywords: string[];
  rating: number;
}

const byRating = (a: Result, b: Result) => b.rating - a.rating;

/** Substring match (cmdk's default is fuzzy, which matched "berserk" to unrelated titles). Title prefix ranks first. */
function matchScore(value: string, search: string, keywords: string[] = []) {
  const q = search.trim().toLowerCase();
  const title = value.split("​")[0].toLowerCase(); // value is "title<zero-width space>id"
  if (title.startsWith(q)) return 1;
  if (title.includes(q)) return 0.8;
  return keywords.some((k) => k.toLowerCase().includes(q)) ? 0.4 : 0;
}

const anime: Result[] = animeList
  .map((a) => ({
    id: a.id,
    title: a.title,
    cover: a.coverImage,
    href: `/anime/${a.id}`,
    meta: `${a.year} · ${a.episodes.length} episodes · ${a.studio}`,
    keywords: [a.nativeTitle, ...a.genres],
    rating: a.rating,
  }))
  .sort(byRating);

const manga: Result[] = mangaList
  .map((m) => ({
    id: m.id,
    title: m.title,
    cover: m.coverImage,
    href: `/manga/${m.id}`,
    meta: `${m.chapters.length} chapters · ${m.author}`,
    keywords: [m.nativeTitle, m.author, ...m.genres],
    rating: m.rating,
  }))
  .sort(byRating);

/** Search button that opens a command palette over titles, native titles, authors and genres. ⌘K / Ctrl+K opens it. */
export function NavSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const group = (heading: string, items: Result[]) => (
    <CommandGroup heading={heading}>
      {items.map((r) => (
        <CommandItem key={r.id} value={`${r.title}​${r.id}`} keywords={r.keywords} onSelect={() => go(r.href)} className="gap-3">
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
        className="size-10 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
      >
        <Search className="size-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search anime and manga" description="Titles, authors, studios and genres" filter={matchScore}>
        <CommandInput placeholder="Search titles, authors, genres…" />
        <CommandList className="max-h-[min(60vh,520px)]">
          <CommandEmpty>Nothing matches. Try a shorter title or a genre like Fantasy.</CommandEmpty>
          {group("Anime", anime)}
          {group("Manga", manga)}
        </CommandList>
      </CommandDialog>
    </>
  );
}

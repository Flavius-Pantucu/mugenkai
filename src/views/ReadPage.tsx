"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronLeft, ChevronRight, ExternalLink, EyeOff, List, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/components/CommentSection";
import type { Chapter, Manga, MangaPage } from "@/data/schema";
import { createLocalStore } from "@/lib/local-store";
import { getProgress, saveChapterPage } from "@/lib/progress";

// Reading mode is a per-device preference: long strip (scroll) or one page at a time.
const modeStore = createLocalStore("mugenkai:reader-mode", z.enum(["strip", "paged"]), "strip");
// Paged-mode options: reading direction (most manga is right-to-left), fit, and two-page spreads on wide screens.
const PrefsSchema = z.object({ dir: z.enum(["ltr", "rtl"]), fit: z.enum(["screen", "width"]), spread: z.enum(["single", "double"]) });
type Prefs = z.infer<typeof PrefsSchema>;
const prefsStore = createLocalStore("mugenkai:reader-prefs", PrefsSchema, { dir: "ltr", fit: "screen", spread: "single" });

/** True on screens wide enough for two pages side by side. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return wide;
}

export function ReadPage({ manga, chapter, pages }: { manga: Manga; chapter: Chapter; pages: MangaPage[] }) {
  const chapterId = chapter.id;
  const router = useRouter();

  const [showControls, setShowControls] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mode = modeStore.useValue();
  const paged = mode === "paged" && pages.length > 0;
  const [page, setPage] = useState(1); // paged mode only: the first page shown
  const prefs = prefsStore.useValue();
  const wide = useWide();
  const spread = paged && prefs.spread === "double" && wide ? 2 : 1;
  const rtl = paged && prefs.dir === "rtl";

  // Paged mode: open at the saved page, then save every turn.
  useEffect(() => {
    if (!paged) return;
    const saved = getProgress().chapters[chapterId];
    setPage(saved && saved.page < saved.pageCount ? Math.min(saved.page, pages.length) : 1);
  }, [paged, chapterId, pages.length]);

  // Track the page in view and save it whenever it changes (that's the "continue reading" bookmark).
  const lastSaved = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !chapter) return;
    lastSaved.current = 0;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
      setShowBackToTop(el.scrollTop > 500);

      const line = el.scrollTop + el.clientHeight * 0.4;
      let page = 1;
      el.querySelectorAll<HTMLElement>("[data-page]").forEach((p) => {
        if (p.offsetTop <= line) page = Number(p.dataset.page);
      });
      if (paged) return; // paged mode saves on each turn instead
      if (page !== lastSaved.current && (page > 1 || lastSaved.current > 0)) {
        lastSaved.current = page;
        saveChapterPage(chapter, page);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [chapter, paged]);

  // Open at the saved page (finished chapters open at the top).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || paged) return;
    const saved = getProgress().chapters[chapterId];
    const target = saved && saved.page < saved.pageCount ? el.querySelector<HTMLElement>(`[data-page="${saved.page}"]`) : null;
    el.scrollTo({ top: target ? target.offsetTop : 0 });
  }, [chapterId, paged]);

  const index = manga.chapters.findIndex((c) => c.id === chapter.id);
  const prevCh = manga.chapters[index - 1];
  const nextCh = manga.chapters[index + 1];
  const chHref = (id: string) => `/read/${manga.id}/${id}`;

  const turnTo = (n: number) => {
    setPage(n);
    saveChapterPage(chapter, Math.min(n + spread - 1, pages.length)); // the last page in view
    scrollRef.current?.scrollTo({ top: 0 });
  };

  /** One step forward/back: a page in paged mode (spilling into the next/previous chapter), a chapter in strip mode. */
  const step = useCallback(
    (dir: 1 | -1) => {
      const to = page + dir * spread;
      if (paged && to >= 1 && to <= pages.length) return turnTo(to);
      if (paged && dir === -1 && page > 1) return turnTo(1); // spread started on page 2
      const target = dir === 1 ? nextCh : prevCh;
      if (target) router.push(chHref(target.id));
    },
    [paged, page, pages.length, nextCh, prevCh, spread], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ← → turn, Esc back to the series. Ignored while typing (comments) or with a menu/sheet open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (document.querySelector('[role="dialog"], [role="listbox"], [role="menu"]')) return;
      // Right-to-left: the left arrow moves forward, like turning a printed manga's page.
      if (e.key === "ArrowRight") step(rtl ? -1 : 1);
      else if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
      else if (e.key === "Escape") router.push(`/manga/${manga.id}`);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, router, manga.id, rtl]);

  // Paged mode tap zones: left third back, right third forward, middle shows/hides the bars.
  const onPageTap = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    if (x < 1 / 3) step(rtl ? 1 : -1);
    else if (x > 2 / 3) step(rtl ? -1 : 1);
    else setShowControls((v) => !v);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0a] pt-16">
      {/* Both bars float over the pages, so hiding them frees the whole screen. */}
      <div
        className={cn(
          "absolute inset-x-0 top-16 z-30 border-b border-white/10 bg-ink-raised/95 backdrop-blur-xl transition-[transform,opacity] duration-300",
          !showControls && "pointer-events-none -translate-y-full opacity-0",
        )}
        aria-hidden={!showControls}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label={`Back to ${manga.title}`}>
              <Link href={`/manga/${manga.id}`}>
                <ChevronLeft className="size-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{manga.title}</p>
              <p className="text-xs text-muted-foreground">Chapter {chapter.chapterNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Chapter list">
                  <List className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-72 border-white/10 bg-ink-raised/95 p-0 backdrop-blur-xl">
                <SheetHeader className="border-b border-white/10">
                  <SheetTitle>Chapters</SheetTitle>
                  <SheetDescription>{manga.chapters.length} total</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-88px)]">
                  <div className="space-y-1 p-2">
                    {manga.chapters.map((ch) => {
                      const current = ch.id === chapter.id;
                      return (
                        <Button
                          key={ch.id}
                          asChild
                          variant="ghost"
                          className={cn("h-auto w-full flex-col items-start gap-0 p-3", current && "bg-primary/15 hover:bg-primary/20")}
                        >
                          <Link href={chHref(ch.id)} aria-current={current ? "page" : undefined}>
                            <span className={cn("text-[13px]", current ? "text-primary" : "text-zinc-300")}>Ch. {ch.chapterNumber}</span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {ch.externalUrl ? "Official site" : `${ch.pageCount} pages`}
                            </span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <ReaderSettings mode={mode} prefs={prefs} wide={wide} />
            <Button variant="ghost" size="icon" onClick={() => setShowControls(false)} aria-label="Hide controls">
              <EyeOff className="size-5" />
            </Button>
          </div>
        </div>
        <Progress value={paged ? (page / pages.length) * 100 : scrollProgress} className="h-0.5 rounded-none bg-white/5" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" onClick={() => setShowControls((v) => !v)}>
        <div className={cn("mx-auto pb-16 pt-[60px]", spread === 2 || (paged && prefs.fit === "width") ? "max-w-6xl" : "max-w-3xl")}>
          {pages.length === 0 && (
            <div className="mx-4 mt-16 rounded-xl border border-white/10 bg-ink-raised p-8 text-center" onClick={(e) => e.stopPropagation()}>
              {chapter.externalUrl ? (
                <>
                  <p className="text-white">This chapter is published on the official site.</p>
                  <Button asChild className="mt-4">
                    <a href={chapter.externalUrl} target="_blank" rel="noopener noreferrer" onClick={() => saveChapterPage(chapter, chapter.pageCount || 1)}>
                      Read chapter {chapter.chapterNumber} on the official site
                      <ExternalLink />
                    </a>
                  </Button>
                </>
              ) : (
                <p className="text-zinc-300">The pages for this chapter couldn&apos;t be loaded right now. Try again in a minute.</p>
              )}
            </div>
          )}

          {paged ? (
            <PagedView pages={pages} page={page} spread={spread} rtl={rtl} fit={prefs.fit} onTap={onPageTap} />
          ) : (
            pages.map((p) => <StripPage key={p.id} page={p} total={pages.length} />)
          )}

          <div className="flex flex-col items-center gap-6 py-16" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-muted-foreground">End of chapter {chapter.chapterNumber}</p>
            {chapter.scanlationGroup && (
              <p className="-mt-4 text-xs text-muted-foreground">
                Translation by {chapter.scanlationGroup}
              </p>
            )}
            <div className="flex gap-3">
              {prevCh && (
                <Button asChild variant="outline">
                  <Link href={chHref(prevCh.id)}>
                    <ChevronLeft />
                    Previous chapter
                  </Link>
                </Button>
              )}
              {nextCh && (
                <Button asChild>
                  <Link href={chHref(nextCh.id)}>
                    Next chapter
                    <ChevronRight />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="px-4 pb-12" onClick={(e) => e.stopPropagation()}>
            <CommentSection threadId={`chapter:${chapter.id}`} title={`Chapter ${chapter.chapterNumber} comments`} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-raised/95 backdrop-blur-xl transition-[transform,opacity] duration-300",
          !showControls && "pointer-events-none translate-y-full opacity-0",
        )}
        aria-hidden={!showControls}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Button variant="ghost" disabled={!prevCh} onClick={() => prevCh && router.push(chHref(prevCh.id))}>
            <ChevronLeft />
            Prev
          </Button>
          <Select value={chapter.id} onValueChange={(id) => router.push(chHref(id))}>
            <SelectTrigger aria-label="Jump to chapter" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {manga.chapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  Chapter {ch.chapterNumber} of {manga.chapters.length}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" disabled={!nextCh} onClick={() => nextCh && router.push(chHref(nextCh.id))}>
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>

      {showBackToTop && (
        <Button
          size="icon"
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-20 right-4 z-30 rounded-full shadow-lg"
        >
          <ArrowUp />
        </Button>
      )}
    </div>
  );
}

/**
 * Strip page. Starts in a 2:3 frame so offsets exist before images load (resuming lands near the
 * right page), then takes the image's real shape: tall webtoon panels would be tiny inside 2:3.
 */
function StripPage({ page, total }: { page: MangaPage; total: number }) {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <div data-page={page.pageNumber} className="relative bg-black" style={{ aspectRatio: ratio ?? 2 / 3 }}>
      <img
        src={page.imageUrl}
        alt={`Page ${page.pageNumber}`}
        className="h-full w-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={(e) => e.currentTarget.naturalHeight && setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
      />
      <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/60 text-[10px] text-zinc-400 backdrop-blur-sm">
        {page.pageNumber} / {total}
      </Badge>
    </div>
  );
}

/** One page (or a two-page spread) fitted to the screen or to the width; the next ones preload. */
function PagedView({
  pages,
  page,
  spread,
  rtl,
  fit,
  onTap,
}: {
  pages: MangaPage[];
  page: number;
  spread: number;
  rtl: boolean;
  fit: Prefs["fit"];
  onTap: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const shown = pages.slice(page - 1, page - 1 + spread);
  const preload = pages.slice(page - 1 + spread, page - 1 + spread * 2);
  if (shown.length === 0) return null;
  const ordered = rtl ? [...shown].reverse() : shown; // a right-to-left spread puts the first page on the right
  return (
    <div
      className={cn(
        "relative flex cursor-pointer justify-center bg-black",
        fit === "screen" ? "h-[calc(100svh-4rem-60px)] items-center" : "items-start",
      )}
      onClick={onTap}
    >
      {ordered.map((p) => (
        <img
          key={p.id}
          src={p.imageUrl}
          alt={`Page ${p.pageNumber}`}
          className={cn("object-contain", fit === "screen" ? "max-h-full" : "h-auto", spread === 2 ? "w-1/2" : "w-full")}
          referrerPolicy="no-referrer"
        />
      ))}
      {preload.map((p) => (
        <img key={p.id} src={p.imageUrl} alt="" aria-hidden className="hidden" referrerPolicy="no-referrer" />
      ))}
      <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/60 text-[10px] text-zinc-400 backdrop-blur-sm">
        {shown.map((p) => p.pageNumber).join("–")} / {pages.length}
      </Badge>
    </div>
  );
}

function ReaderSettings({ mode, prefs, wide }: { mode: "strip" | "paged"; prefs: Prefs; wide: boolean }) {
  const set = (p: Partial<Prefs>) => prefsStore.write((cur) => ({ ...cur, ...p }));
  const item = "flex-1 px-3 text-[13px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";
  const row = (label: string, node: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      {node}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Reader settings">
          <Settings2 className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4" onClick={(e) => e.stopPropagation()}>
        {row(
          "Layout",
          <ToggleGroup type="single" variant="outline" className="w-full" value={mode} onValueChange={(v) => v && modeStore.write(() => v as "strip" | "paged")}>
            <ToggleGroupItem value="strip" className={item}>
              Long strip
            </ToggleGroupItem>
            <ToggleGroupItem value="paged" className={item}>
              Pages
            </ToggleGroupItem>
          </ToggleGroup>,
          mode === "strip" ? "Best for webtoons and manhwa." : undefined,
        )}
        {mode === "paged" && (
          <>
            {row(
              "Direction",
              <ToggleGroup type="single" variant="outline" className="w-full" value={prefs.dir} onValueChange={(v) => v && set({ dir: v as Prefs["dir"] })}>
                <ToggleGroupItem value="rtl" className={item}>
                  Right to left
                </ToggleGroupItem>
                <ToggleGroupItem value="ltr" className={item}>
                  Left to right
                </ToggleGroupItem>
              </ToggleGroup>,
              "Japanese manga reads right to left.",
            )}
            {row(
              "Fit",
              <ToggleGroup type="single" variant="outline" className="w-full" value={prefs.fit} onValueChange={(v) => v && set({ fit: v as Prefs["fit"] })}>
                <ToggleGroupItem value="screen" className={item}>
                  Screen
                </ToggleGroupItem>
                <ToggleGroupItem value="width" className={item}>
                  Width
                </ToggleGroupItem>
              </ToggleGroup>,
            )}
            {wide &&
              row(
                "Pages at once",
                <ToggleGroup type="single" variant="outline" className="w-full" value={prefs.spread} onValueChange={(v) => v && set({ spread: v as Prefs["spread"] })}>
                  <ToggleGroupItem value="single" className={item}>
                    One
                  </ToggleGroupItem>
                  <ToggleGroupItem value="double" className={item}>
                    Two
                  </ToggleGroupItem>
                </ToggleGroup>,
              )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

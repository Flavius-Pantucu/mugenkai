"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowUp, ChevronLeft, ChevronRight, EyeOff, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CommentSection } from "@/components/CommentSection";
import { getPages, mangaList } from "@/data/mock-data";
import { getProgress, saveChapterPage } from "@/lib/progress";
import { NotFoundPage } from "./NotFoundPage";

export function ReadPage() {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const router = useRouter();
  const manga = mangaList.find((m) => m.id === mangaId);
  const chapter = manga?.chapters.find((c) => c.id === chapterId);
  const pages = useMemo(() => (manga && chapter ? getPages(manga, chapter) : []), [manga, chapter]);

  const [showControls, setShowControls] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      if (page !== lastSaved.current && (page > 1 || lastSaved.current > 0)) {
        lastSaved.current = page;
        saveChapterPage(chapter, page);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [chapter]);

  // Open at the saved page (finished chapters open at the top).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = getProgress().chapters[chapterId];
    const target = saved && saved.page < saved.pageCount ? el.querySelector<HTMLElement>(`[data-page="${saved.page}"]`) : null;
    el.scrollTo({ top: target ? target.offsetTop : 0 });
  }, [chapterId]);

  if (!manga || !chapter) return <NotFoundPage />;

  const index = manga.chapters.findIndex((c) => c.id === chapter.id);
  const prevCh = manga.chapters[index - 1];
  const nextCh = manga.chapters[index + 1];
  const chHref = (id: string) => `/read/${manga.id}/${id}`;

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
                            <span className="text-[11px] font-normal text-muted-foreground">{ch.pageCount} pages</span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" onClick={() => setShowControls(false)} aria-label="Hide controls">
              <EyeOff className="size-5" />
            </Button>
          </div>
        </div>
        <Progress value={scrollProgress} className="h-0.5 rounded-none bg-white/5" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" onClick={() => setShowControls((v) => !v)}>
        <div className="mx-auto max-w-3xl pb-16 pt-[60px]">
          {pages.map((page) => (
            // Fixed 2:3 frame: page offsets are known before images load, so resuming lands on the right page.
            <div key={page.id} data-page={page.pageNumber} className="relative aspect-[2/3] bg-black">
              <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="h-full w-full object-contain" loading="lazy" />
              <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/60 text-[10px] text-zinc-400 backdrop-blur-sm">
                {page.pageNumber} / {pages.length}
              </Badge>
            </div>
          ))}

          <div className="flex flex-col items-center gap-6 py-16" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-muted-foreground">End of chapter {chapter.chapterNumber}</p>
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

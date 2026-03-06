import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, ChevronUp, Settings, List, Maximize, ArrowUp } from "lucide-react";
import { mangaList } from "../data/mock-data";

export function ReadPage() {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();
  const manga = mangaList.find((m) => m.id === mangaId);
  const chapter = manga?.chapters.find((c) => c.id === chapterId);
  const [showControls, setShowControls] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(pct);
      setShowBackToTop(scrollTop > 500);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [chapter]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [chapterId]);

  if (!manga || !chapter) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-zinc-400">Chapter not found</p>
      </div>
    );
  }

  const currentChIdx = manga.chapters.findIndex((c) => c.id === chapter.id);
  const prevCh = currentChIdx > 0 ? manga.chapters[currentChIdx - 1] : null;
  const nextCh = currentChIdx < manga.chapters.length - 1 ? manga.chapters[currentChIdx + 1] : null;

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      <div
        className={`bg-[#0f0f14]/95 backdrop-blur-xl border-b border-purple-500/10 transition-all duration-300 z-30 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/manga/${manga.id}`)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0">
              <p className="text-white truncate" style={{ fontSize: "14px", fontWeight: 600 }}>
                {manga.title}
              </p>
              <p className="text-zinc-500" style={{ fontSize: "12px" }}>
                Chapter {chapter.chapterNumber} - {chapter.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>

        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-100"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
          onClick={() => setShowControls(!showControls)}
        >
          <div className="max-w-3xl mx-auto">
            {chapter.pages.map((page) => (
              <div key={page.id} className="relative">
                <img
                  src={page.imageUrl}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-zinc-400" style={{ fontSize: "10px" }}>
                  {page.pageNumber} / {chapter.pages.length}
                </div>
              </div>
            ))}

            <div className="py-16 flex flex-col items-center gap-6">
              <p className="text-zinc-600" style={{ fontSize: "14px" }}>
                End of Chapter {chapter.chapterNumber}
              </p>
              <div className="flex gap-3">
                {prevCh && (
                  <button
                    onClick={() => navigate(`/read/${manga.id}/${prevCh.id}`)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-xl hover:bg-white/10 transition-all"
                    style={{ fontSize: "13px" }}
                  >
                    <ChevronLeft size={16} /> Previous Chapter
                  </button>
                )}
                {nextCh && (
                  <button
                    onClick={() => navigate(`/read/${manga.id}/${nextCh.id}`)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-500 hover:to-fuchsia-500 transition-all"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    Next Chapter <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showChapterList && (
          <div className="w-72 bg-[#0f0f14]/95 backdrop-blur-xl border-l border-purple-500/10 overflow-y-auto z-20">
            <div className="p-4 border-b border-purple-500/10 sticky top-0 bg-[#0f0f14]/95 backdrop-blur-xl">
              <h3 className="text-white" style={{ fontSize: "14px", fontWeight: 600 }}>Chapters</h3>
            </div>
            <div className="p-2">
              {manga.chapters.slice(0, 30).map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    navigate(`/read/${manga.id}/${ch.id}`);
                    setShowChapterList(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    ch.id === chapter.id
                      ? "bg-violet-500/20 border border-violet-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <p className={`${ch.id === chapter.id ? "text-violet-300" : "text-zinc-300"}`} style={{ fontSize: "13px", fontWeight: 500 }}>
                    Ch. {ch.chapterNumber}
                  </p>
                  <p className="text-zinc-600" style={{ fontSize: "11px" }}>{ch.pages.length} pages</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={`bg-[#0f0f14]/95 backdrop-blur-xl border-t border-purple-500/10 transition-all duration-300 ${
          showControls ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => prevCh && navigate(`/read/${manga.id}/${prevCh.id}`)}
            disabled={!prevCh}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontSize: "13px" }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-zinc-500" style={{ fontSize: "13px" }}>
            Chapter {chapter.chapterNumber} of {manga.chapters.length}
          </span>
          <button
            onClick={() => nextCh && navigate(`/read/${manga.id}/${nextCh.id}`)}
            disabled={!nextCh}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontSize: "13px" }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 p-3 bg-violet-600/80 backdrop-blur-sm text-white rounded-full shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-all z-30"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}

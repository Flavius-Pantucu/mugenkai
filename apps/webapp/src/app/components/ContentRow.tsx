import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string;
}

export function ContentRow({ title, subtitle, children, accentColor = "#8b5cf6" }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="relative py-4">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <div>
            <h2
              className="text-white"
              style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
                fontWeight: 700,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-zinc-500" style={{ fontSize: "13px" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className={`p-2 rounded-lg border transition-all ${
              canScrollLeft
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-transparent border-white/5 text-zinc-600 cursor-default"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`p-2 rounded-lg border transition-all ${
              canScrollRight
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-transparent border-white/5 text-zinc-600 cursor-default"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>

        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-[#09090b] to-transparent pointer-events-none z-10" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-[#09090b] to-transparent pointer-events-none z-10" />
        )}
      </div>
    </section>
  );
}

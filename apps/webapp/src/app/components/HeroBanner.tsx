import { useState, useEffect, useCallback } from "react";
import { Play, Plus, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import type { Anime } from "../data/mock-data";

interface HeroBannerProps {
  items: Anime[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(idx);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [isTransitioning]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [current, items.length, goTo]);

  const anime = items[current];
  if (!anime) return null;

  return (
    <div className="relative w-full h-[85vh] min-h-[500px] max-h-[900px] overflow-hidden">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: idx === current ? 1 : 0 }}
        >
          <img
            src={item.bannerImage}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/40" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090b] to-transparent" />
        </div>
      ))}

      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div
            className="max-w-2xl transition-all duration-700"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateY(20px)" : "translateY(0)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full border ${
                  anime.status === "ONGOING"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                }`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {anime.status}
              </span>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} fill="currentColor" />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{anime.rating}</span>
              </div>
              <span className="text-zinc-500" style={{ fontSize: "13px" }}>
                {anime.episodes.length} Episodes
              </span>
            </div>

            <h1
              className="text-white mb-4 drop-shadow-2xl"
              style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              {anime.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-md bg-white/5 text-zinc-300 border border-white/5"
                  style={{ fontSize: "12px" }}
                >
                  {g}
                </span>
              ))}
            </div>

            <p
              className="text-zinc-300 mb-8 line-clamp-3"
              style={{ fontSize: "15px", lineHeight: 1.6 }}
            >
              {anime.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(`/watch/${anime.id}/${anime.episodes[0]?.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                <Play size={20} fill="white" /> Watch Now
              </button>
              <button
                onClick={() => navigate(`/anime/${anime.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/15 transition-all border border-white/10 hover:border-white/20"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                <Info size={20} /> More Info
              </button>
              <button className="p-3 bg-white/5 backdrop-blur-sm text-white rounded-xl hover:bg-white/10 transition-all border border-white/10">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => goTo((current - 1 + items.length) % items.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-black/50 transition-all hidden md:block"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => goTo((current + 1) % items.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-black/50 transition-all hidden md:block"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`transition-all duration-500 rounded-full ${
              idx === current
                ? "w-8 h-2 bg-purple-500"
                : "w-2 h-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Play, Star, BookOpen, Clock } from "lucide-react";
import type { Anime, Manga, WatchHistory } from "../data/mock-data";

interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="relative flex-shrink-0 w-[180px] sm:w-[200px] cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/anime/${anime.id}`)}
    >
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300 aspect-[2/3]"
        style={{
          transform: hovered ? "scale(1.05)" : "scale(1)",
          boxShadow: hovered
            ? "0 20px 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)"
            : "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div
          className="absolute inset-0 bg-purple-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <button className="p-3 bg-purple-600 rounded-full shadow-lg shadow-purple-500/40 hover:scale-110 transition-transform">
            <Play size={20} fill="white" className="text-white ml-0.5" />
          </button>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md">
          <Star size={10} fill="#facc15" className="text-yellow-400" />
          <span className="text-yellow-400" style={{ fontSize: "11px", fontWeight: 600 }}>
            {anime.rating}
          </span>
        </div>

        {anime.status === "ONGOING" && (
          <div className="absolute top-2 left-2">
            <span
              className="px-2 py-0.5 bg-green-500/80 backdrop-blur-sm rounded-md text-white"
              style={{ fontSize: "10px", fontWeight: 600 }}
            >
              AIRING
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p
            className="text-white truncate"
            style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-family-heading)" }}
          >
            {anime.title}
          </p>
          <p className="text-zinc-400 truncate" style={{ fontSize: "11px" }}>
            {anime.genres.slice(0, 2).join(" / ")}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="relative flex-shrink-0 w-[180px] sm:w-[200px] cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/manga/${manga.id}`)}
    >
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300 aspect-[2/3]"
        style={{
          transform: hovered ? "scale(1.05)" : "scale(1)",
          boxShadow: hovered
            ? "0 20px 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)"
            : "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <img src={manga.coverImage} alt={manga.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div
          className="absolute inset-0 bg-violet-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <button className="p-3 bg-violet-600 rounded-full shadow-lg shadow-violet-500/40 hover:scale-110 transition-transform">
            <BookOpen size={20} className="text-white" />
          </button>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md">
          <Star size={10} fill="#facc15" className="text-yellow-400" />
          <span className="text-yellow-400" style={{ fontSize: "11px", fontWeight: 600 }}>
            {manga.rating}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p
            className="text-white truncate"
            style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-family-heading)" }}
          >
            {manga.title}
          </p>
          <p className="text-zinc-400 truncate" style={{ fontSize: "11px" }}>
            {manga.chapters.length} Chapters
          </p>
        </div>
      </div>
    </div>
  );
}

interface ContinueCardProps {
  history: WatchHistory;
}

export function ContinueWatchingCard({ history }: ContinueCardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 w-[280px] sm:w-[320px] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/watch/${history.animeId}/${history.episodeId}`)}
    >
      <div
        className="relative rounded-xl overflow-hidden transition-all duration-300 aspect-video"
        style={{
          transform: hovered ? "scale(1.03)" : "scale(1)",
          boxShadow: hovered
            ? "0 15px 30px rgba(139, 92, 246, 0.25)"
            : "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <img
          src={history.anime.coverImage}
          alt={history.anime.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <div className="p-4 bg-purple-600/80 backdrop-blur-sm rounded-full shadow-lg">
            <Play size={24} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="w-full h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-r-full"
              style={{ width: `${history.progress}%` }}
            />
          </div>
          <div className="p-3">
            <p className="text-white" style={{ fontSize: "13px", fontWeight: 600 }}>
              {history.anime.title}
            </p>
            <div className="flex items-center gap-2 text-zinc-400" style={{ fontSize: "11px" }}>
              <Clock size={10} />
              <span>EP {history.episode.episodeNumber} - {history.progress}% watched</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

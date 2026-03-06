import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Play, Plus, Star, Clock, Calendar, Film, ChevronDown,
  Heart, Share2, Check
} from "lucide-react";
import { animeList } from "../data/mock-data";
import { Footer } from "../components/Footer";
import { ContentRow } from "../components/ContentRow";
import { AnimeCard } from "../components/ContentCard";

export function AnimeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const anime = animeList.find((a) => a.id === id);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center pt-16">
        <p className="text-zinc-400">Anime not found</p>
      </div>
    );
  }

  const displayedEpisodes = showAllEpisodes ? anime.episodes : anime.episodes.slice(0, 12);
  const relatedAnime = animeList.filter((a) => a.id !== anime.id).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="relative h-[60vh] min-h-[400px] max-h-[600px]">
        <img src={anime.bannerImage} alt={anime.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-[#09090b]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 -mt-64 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <div className="w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/10">
              <img src={anime.coverImage} alt={anime.title} className="w-full aspect-[2/3] object-cover" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <div className="flex flex-wrap items-center gap-3 mb-3">
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
            </div>

            <h1
              className="text-white mb-3"
              style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {anime.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-zinc-400" style={{ fontSize: "13px" }}>
              <span className="flex items-center gap-1.5"><Film size={14} /> {anime.studio}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {anime.releaseDate}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {anime.episodes.length} Episodes</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {anime.genres.map((g) => (
                <span key={g} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/15 text-purple-300" style={{ fontSize: "12px" }}>
                  {g}
                </span>
              ))}
            </div>

            <p className="text-zinc-400 mb-6" style={{ fontSize: "14px", lineHeight: 1.7 }}>
              {anime.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/watch/${anime.id}/${anime.episodes[0]?.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                <Play size={18} fill="white" /> Watch Now
              </button>
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all border ${
                  bookmarked
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                {bookmarked ? <Check size={18} /> : <Plus size={18} />}
                {bookmarked ? "Bookmarked" : "Add to List"}
              </button>
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
                <Heart size={18} />
              </button>
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all">
                <Share2 size={18} />
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <h2
            className="text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "20px", fontWeight: 700 }}
          >
            <div className="w-1 h-6 rounded-full bg-purple-500" />
            Episodes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedEpisodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => navigate(`/watch/${anime.id}/${ep.id}`)}
                className="group cursor-pointer bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden hover:bg-white/[0.05] hover:border-purple-500/20 transition-all"
              >
                <div className="relative aspect-video">
                  <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-purple-600/80 rounded-full">
                      <Play size={18} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-white" style={{ fontSize: "11px" }}>
                    {ep.duration}m
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-zinc-300" style={{ fontSize: "13px", fontWeight: 500 }}>
                    EP {ep.episodeNumber}
                  </p>
                  <p className="text-zinc-500" style={{ fontSize: "12px" }}>{ep.title}</p>
                </div>
              </div>
            ))}
          </div>

          {anime.episodes.length > 12 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                style={{ fontSize: "14px" }}
              >
                {showAllEpisodes ? "Show Less" : `Show All ${anime.episodes.length} Episodes`}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showAllEpisodes ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          )}
        </motion.div>

        <div className="mt-12">
          <ContentRow title="You Might Also Like" accentColor="#ec4899">
            {relatedAnime.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </ContentRow>
        </div>
      </div>

      <Footer />
    </div>
  );
}

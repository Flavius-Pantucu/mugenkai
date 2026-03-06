import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { BookOpen, Plus, Star, Calendar, User, ChevronDown, Heart, Share2, Check } from "lucide-react";
import { mangaList } from "../data/mock-data";
import { Footer } from "../components/Footer";
import { ContentRow } from "../components/ContentRow";
import { MangaCard } from "../components/ContentCard";

export function MangaDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const manga = mangaList.find((m) => m.id === id);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center pt-16">
        <p className="text-zinc-400">Manga not found</p>
      </div>
    );
  }

  const displayedChapters = showAllChapters ? manga.chapters : manga.chapters.slice(0, 20);
  const relatedManga = mangaList.filter((m) => m.id !== manga.id).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="relative h-[50vh] min-h-[350px] max-h-[500px]">
        <img src={manga.bannerImage} alt={manga.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-[#09090b]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 -mt-48 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <div className="w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-violet-500/10">
              <img src={manga.coverImage} alt={manga.title} className="w-full aspect-[2/3] object-cover" />
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
                  manga.status === "ONGOING"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                }`}
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                {manga.status}
              </span>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} fill="currentColor" />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{manga.rating}</span>
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
              {manga.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-zinc-400" style={{ fontSize: "13px" }}>
              <span className="flex items-center gap-1.5"><User size={14} /> {manga.author}</span>
              <span className="flex items-center gap-1.5"><BookOpen size={14} /> {manga.chapters.length} Chapters</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {manga.genres.map((g) => (
                <span key={g} className="px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/15 text-violet-300" style={{ fontSize: "12px" }}>
                  {g}
                </span>
              ))}
            </div>

            <p className="text-zinc-400 mb-6" style={{ fontSize: "14px", lineHeight: 1.7 }}>
              {manga.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/read/${manga.id}/${manga.chapters[0]?.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 active:scale-95"
                style={{ fontSize: "14px", fontWeight: 600 }}
              >
                <BookOpen size={18} /> Start Reading
              </button>
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all border ${
                  bookmarked
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
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
            <div className="w-1 h-6 rounded-full bg-violet-500" />
            Chapters
          </h2>

          <div className="space-y-2">
            {displayedChapters.map((ch) => (
              <div
                key={ch.id}
                onClick={() => navigate(`/read/${manga.id}/${ch.id}`)}
                className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] hover:border-violet-500/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center text-violet-300"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    {ch.chapterNumber}
                  </span>
                  <div>
                    <p className="text-zinc-300 group-hover:text-white transition-colors" style={{ fontSize: "14px", fontWeight: 500 }}>
                      {ch.title}
                    </p>
                    <p className="text-zinc-600" style={{ fontSize: "12px" }}>{ch.pages.length} pages</p>
                  </div>
                </div>
                <BookOpen size={16} className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
              </div>
            ))}
          </div>

          {manga.chapters.length > 20 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAllChapters(!showAllChapters)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                style={{ fontSize: "14px" }}
              >
                {showAllChapters ? "Show Less" : `Show All ${manga.chapters.length} Chapters`}
                <ChevronDown size={16} className={`transition-transform ${showAllChapters ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </motion.div>

        <div className="mt-12">
          <ContentRow title="Similar Manga" accentColor="#f59e0b">
            {relatedManga.map((m) => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </ContentRow>
        </div>
      </div>

      <Footer />
    </div>
  );
}

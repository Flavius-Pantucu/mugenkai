import { Link } from "react-router";
import { motion } from "motion/react";
import { Play, BookOpen, Zap, Shield, Sparkles, ChevronRight } from "lucide-react";
import { animeList, mangaList } from "../data/mock-data";

export function LandingPage() {
  const featuredAnime = animeList[2];

  return (
    <div className="min-h-screen bg-[#09090b] overflow-hidden">
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={featuredAnime.bannerImage}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/60 via-[#09090b]/80 to-[#09090b]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-transparent to-[#09090b]" />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-purple-600/10 blur-[120px]"
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            style={{ top: "20%", left: "10%" }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full bg-violet-500/10 blur-[100px]"
            animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{ top: "40%", right: "15%" }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-purple-300" style={{ fontSize: "13px" }}>
                Limitless anime & manga streaming
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white mb-6"
            style={{
              fontFamily: "var(--font-family-heading)",
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              MUGENKAI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-zinc-400 mb-10 max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", lineHeight: 1.6 }}
          >
            Dive into an infinite world of anime and manga. Stream your favorite series,
            discover new stories, and join a community of passionate fans.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
              style={{ fontSize: "16px", fontWeight: 600 }}
            >
              Get Started Free <ChevronRight size={18} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl hover:bg-white/10 transition-all border border-white/10"
              style={{ fontSize: "16px", fontWeight: 600 }}
            >
              Sign In
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-6 flex items-center gap-4 justify-center text-zinc-500"
            style={{ fontSize: "14px" }}
          >
            <span>or browse:</span>
            <Link to="/anime" className="text-purple-400 hover:text-purple-300 transition-colors">
              Anime
            </Link>
            <span>•</span>
            <Link to="/manga" className="text-violet-400 hover:text-violet-300 transition-colors">
              Manga
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 rounded-full bg-purple-400" />
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "var(--font-family-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 800,
            }}
          >
            Everything You Need
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto" style={{ fontSize: "16px" }}>
            A complete platform built for the ultimate anime and manga experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Play,
              title: "Stream Anime",
              desc: "Watch thousands of episodes in HD with no interruptions. Autoplay, progress tracking, and subtitle support.",
              color: "#8b5cf6",
            },
            {
              icon: BookOpen,
              title: "Read Manga",
              desc: "Smooth vertical reader with page-turn animations. Read comfortably on any device.",
              color: "#06b6d4",
            },
            {
              icon: Zap,
              title: "Instant Updates",
              desc: "Get notified the moment new episodes or chapters drop. Never miss a release.",
              color: "#f59e0b",
            },
            {
              icon: Shield,
              title: "Personal Library",
              desc: "Bookmark favorites, track progress, and manage your watch/read list effortlessly.",
              color: "#10b981",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-purple-500/20 transition-all group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
              >
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>
              <h3
                className="text-white mb-2"
                style={{ fontSize: "16px", fontWeight: 600, fontFamily: "var(--font-family-heading)" }}
              >
                {feature.title}
              </h3>
              <p className="text-zinc-500" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-white mb-4"
            style={{
              fontFamily: "var(--font-family-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 800,
            }}
          >
            Trending Now
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...animeList.slice(0, 5), ...mangaList.slice(0, 5)].map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative rounded-xl overflow-hidden aspect-[2/3] group cursor-pointer"
            >
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                <p className="text-white truncate" style={{ fontSize: "13px", fontWeight: 600 }}>
                  {item.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center p-12 rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-fuchsia-600/20 border border-purple-500/20 rounded-3xl" />
          <div className="absolute inset-0 backdrop-blur-xl rounded-3xl" />
          <div className="relative z-10">
            <h2
              className="text-white mb-4"
              style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 800,
              }}
            >
              Ready to Begin?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto" style={{ fontSize: "16px" }}>
              Join thousands of fans already exploring the boundless world of Mugenkai.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
              style={{ fontSize: "16px", fontWeight: 600 }}
            >
              Create Free Account <ChevronRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <defs>
                  <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#8b5cf6", stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: "#a78bfa", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#c4b5fd", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M 8 20 C 8 14 12 10 16 10 C 20 10 22 14 24 20 C 26 26 28 30 32 30 C 36 30 40 26 40 20 C 40 14 36 10 32 10 C 28 10 26 14 24 20 C 22 26 20 30 16 30 C 12 30 8 26 8 20 Z"
                  fill="url(#footerLogoGradient)"
                />
              </svg>
            </div>
            <span className="text-zinc-600" style={{ fontSize: "12px" }}>
              2026 Mugenkai. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Terms", "Privacy", "Contact"].map((item) => (
              <span key={item} className="text-zinc-600 hover:text-purple-400 cursor-pointer transition-colors" style={{ fontSize: "12px" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
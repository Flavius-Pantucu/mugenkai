import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  User, Settings, Heart, Clock, BookOpen, Tv,
  Edit, Camera, Shield
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { animeList, mangaList, continueWatching } from "../data/mock-data";
import { Footer } from "../components/Footer";

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "watchlist" | "favorites" | "settings">("overview");

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center pt-16">
        <p className="text-zinc-400">Please sign in to view your profile</p>
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: User },
    { key: "watchlist" as const, label: "Watch List", icon: Clock },
    { key: "favorites" as const, label: "Favorites", icon: Heart },
    { key: "settings" as const, label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Anime Watched", value: 47, icon: Tv, color: "#8b5cf6" },
    { label: "Manga Read", value: 23, icon: BookOpen, color: "#06b6d4" },
    { label: "Hours Spent", value: 312, icon: Clock, color: "#f59e0b" },
    { label: "Favorites", value: user.favorites.length, icon: Heart, color: "#ec4899" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] pt-16">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 sm:h-64 overflow-hidden">
          <img
            src={animeList[2].bannerImage}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            <div className="relative group">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-[#09090b] shadow-2xl"
              />
              <button className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </button>
              {user.role === "ADMIN" && (
                <div className="absolute -top-2 -right-2 p-1.5 bg-purple-600 rounded-lg shadow-lg">
                  <Shield size={14} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3">
                <h1
                  className="text-white"
                  style={{ fontFamily: "var(--font-family-heading)", fontSize: "24px", fontWeight: 800 }}
                >
                  {user.username}
                </h1>
                <button className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                  <Edit size={16} />
                </button>
              </div>
              <p className="text-zinc-500" style={{ fontSize: "14px" }}>{user.bio}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.preferredGenres.map((g) => (
                  <span key={g} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/15" style={{ fontSize: "11px" }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-1 overflow-x-auto border-b border-white/5 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
                    >
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p
                    className="text-white"
                    style={{ fontFamily: "var(--font-family-heading)", fontSize: "28px", fontWeight: 800 }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-zinc-500" style={{ fontSize: "13px" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div>
              <h3
                className="text-white mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-family-heading)", fontSize: "18px", fontWeight: 700 }}
              >
                <Clock size={18} className="text-cyan-400" /> Continue Watching
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {continueWatching.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    onClick={() => navigate(`/watch/${h.animeId}/${h.episodeId}`)}
                    className="flex gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-purple-500/15 transition-all cursor-pointer"
                  >
                    <img
                      src={h.anime.coverImage}
                      alt={h.anime.title}
                      className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-white truncate" style={{ fontSize: "14px", fontWeight: 600 }}>{h.anime.title}</p>
                        <p className="text-zinc-500" style={{ fontSize: "12px" }}>EP {h.episode.episodeNumber}</p>
                      </div>
                      <div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                            style={{ width: `${h.progress}%` }}
                          />
                        </div>
                        <p className="text-zinc-600 mt-1" style={{ fontSize: "11px" }}>{h.progress}% completed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "watchlist" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {animeList.slice(0, 8).map((anime) => (
                <div
                  key={anime.id}
                  onClick={() => navigate(`/anime/${anime.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative rounded-xl overflow-hidden aspect-[2/3]">
                    <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white truncate" style={{ fontSize: "13px", fontWeight: 600 }}>{anime.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "favorites" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {user.favorites.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/${"episodes" in item ? "anime" : "manga"}/${item.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative rounded-xl overflow-hidden aspect-[2/3]">
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <Heart size={16} fill="#ec4899" className="text-pink-500" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white truncate" style={{ fontSize: "13px", fontWeight: 600 }}>{item.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl space-y-6"
          >
            {[
              { label: "Email", value: user.email, type: "email" },
              { label: "Username", value: user.username, type: "text" },
              { label: "Bio", value: user.bio, type: "textarea" },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    defaultValue={field.value}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
                    style={{ fontSize: "14px" }}
                  />
                ) : (
                  <input
                    type={field.type}
                    defaultValue={field.value}
                    className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    style={{ fontSize: "14px" }}
                  />
                )}
              </div>
            ))}

            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div>
                <p className="text-white" style={{ fontSize: "14px", fontWeight: 500 }}>Mature Content</p>
                <p className="text-zinc-500" style={{ fontSize: "12px" }}>Show mature-rated content</p>
              </div>
              <button className="w-12 h-6 rounded-full bg-purple-600 relative">
                <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5 shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div>
                <p className="text-white" style={{ fontSize: "14px", fontWeight: 500 }}>Notifications</p>
                <p className="text-zinc-500" style={{ fontSize: "12px" }}>Receive episode/chapter alerts</p>
              </div>
              <button className="w-12 h-6 rounded-full bg-purple-600 relative">
                <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5 shadow" />
              </button>
            </div>

            <button
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20"
              style={{ fontSize: "14px", fontWeight: 600 }}
            >
              Save Changes
            </button>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}

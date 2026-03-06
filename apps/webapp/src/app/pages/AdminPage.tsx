import { useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard, Users, Tv, BookOpen, TrendingUp,
  Plus, Search, MoreVertical, Eye, Edit, Trash2,
  ArrowUp, ArrowDown, Activity
} from "lucide-react";
import { animeList, mangaList } from "../data/mock-data";
import { Footer } from "../components/Footer";

export function AdminPage() {
  const [activeSection, setActiveSection] = useState<"dashboard" | "anime" | "manga" | "users">("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);

  const sidebarItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { key: "anime" as const, label: "Anime", icon: Tv },
    { key: "manga" as const, label: "Manga", icon: BookOpen },
    { key: "users" as const, label: "Users", icon: Users },
  ];

  const dashStats = [
    { label: "Total Users", value: "12,847", change: "+12%", up: true, icon: Users, color: "#8b5cf6" },
    { label: "Active Anime", value: animeList.length.toString(), change: "+3", up: true, icon: Tv, color: "#06b6d4" },
    { label: "Active Manga", value: mangaList.length.toString(), change: "+2", up: true, icon: BookOpen, color: "#f59e0b" },
    { label: "Daily Streams", value: "34,291", change: "+8%", up: true, icon: TrendingUp, color: "#10b981" },
  ];

  const recentActivity = [
    { action: "New user registered", user: "AkiraFan42", time: "2 min ago" },
    { action: "Episode uploaded", detail: "Phantom Edge EP 25", time: "15 min ago" },
    { action: "Chapter published", detail: "Crimson Canvas Ch. 46", time: "1 hour ago" },
    { action: "Content reported", detail: "Dragon's Requiem EP 12", time: "2 hours ago" },
    { action: "New user registered", user: "MangaLover99", time: "3 hours ago" },
    { action: "Anime created", detail: "Summit of Legends S2", time: "5 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] pt-16">
      <div className="flex">
        <div className="hidden md:flex flex-col w-60 min-h-[calc(100vh-4rem)] bg-[#0c0c14] border-r border-purple-500/10 p-4">
          <h2
            className="text-white px-3 mb-6"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "18px", fontWeight: 700 }}
          >
            Admin Panel
          </h2>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeSection === item.key
                    ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
                style={{ fontSize: "14px", fontWeight: 500 }}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0c14]/95 backdrop-blur-xl border-t border-purple-500/10 z-40 flex">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                activeSection === item.key ? "text-purple-400" : "text-zinc-500"
              }`}
            >
              <item.icon size={18} />
              <span style={{ fontSize: "10px" }}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {activeSection === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h1
                className="text-white"
                style={{ fontFamily: "var(--font-family-heading)", fontSize: "24px", fontWeight: 800 }}
              >
                Dashboard
              </h1>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/15 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}20` }}
                      >
                        <stat.icon size={18} style={{ color: stat.color }} />
                      </div>
                      <span
                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                          stat.up ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                        }`}
                        style={{ fontSize: "11px", fontWeight: 600 }}
                      >
                        {stat.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        {stat.change}
                      </span>
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

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <Activity size={18} className="text-purple-400" />
                  <h3 className="text-white" style={{ fontSize: "16px", fontWeight: 600 }}>
                    Recent Activity
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-zinc-300" style={{ fontSize: "13px" }}>
                          {activity.action}
                          {activity.detail && (
                            <span className="text-purple-400"> {activity.detail}</span>
                          )}
                          {activity.user && (
                            <span className="text-cyan-400"> {activity.user}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-zinc-600 flex-shrink-0 ml-4" style={{ fontSize: "12px" }}>
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {(activeSection === "anime" || activeSection === "manga") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1
                  className="text-white"
                  style={{ fontFamily: "var(--font-family-heading)", fontSize: "24px", fontWeight: 800 }}
                >
                  Manage {activeSection === "anime" ? "Anime" : "Manga"}
                </h1>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20"
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  <Plus size={16} /> Add {activeSection === "anime" ? "Anime" : "Manga"}
                </button>
              </div>

              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  placeholder={`Search ${activeSection}...`}
                  className="w-full pl-12 pr-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-all"
                  style={{ fontSize: "14px" }}
                />
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>TITLE</th>
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>STATUS</th>
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>RATING</th>
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>
                        {activeSection === "anime" ? "EPISODES" : "CHAPTERS"}
                      </th>
                      <th className="text-right px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(activeSection === "anime" ? animeList : mangaList).map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={item.coverImage} alt="" className="w-10 h-14 rounded object-cover" />
                            <div>
                              <p className="text-white" style={{ fontSize: "13px", fontWeight: 500 }}>{item.title}</p>
                              <p className="text-zinc-600" style={{ fontSize: "11px" }}>{item.genres.slice(0, 2).join(", ")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              item.status === "ONGOING"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                            style={{ fontSize: "11px", fontWeight: 600 }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-yellow-400" style={{ fontSize: "13px" }}>{item.rating}</td>
                        <td className="px-4 py-3 text-zinc-400" style={{ fontSize: "13px" }}>
                          {"episodes" in item ? item.episodes.length : ("chapters" in item ? (item as any).chapters.length : 0)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                              <Eye size={14} />
                            </button>
                            <button className="p-2 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/5 rounded-lg transition-all">
                              <Edit size={14} />
                            </button>
                            <button className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeSection === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h1
                className="text-white"
                style={{ fontFamily: "var(--font-family-heading)", fontSize: "24px", fontWeight: 800 }}
              >
                User Management
              </h1>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>USER</th>
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>ROLE</th>
                      <th className="text-left px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>JOINED</th>
                      <th className="text-right px-4 py-3 text-zinc-500" style={{ fontSize: "12px", fontWeight: 600 }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { name: "ShadowBlade99", email: "shadow@mugenkai.dev", role: "ADMIN", joined: "Jan 2025" },
                      { name: "AkiraFan42", email: "akira@example.com", role: "USER", joined: "Mar 2025" },
                      { name: "MangaLover99", email: "manga@example.com", role: "USER", joined: "Feb 2026" },
                      { name: "NeonKnight", email: "neon@example.com", role: "USER", joined: "Dec 2025" },
                      { name: "SakuraWind", email: "sakura@example.com", role: "USER", joined: "Nov 2025" },
                    ].map((user) => (
                      <tr key={user.name} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white" style={{ fontSize: "13px", fontWeight: 500 }}>{user.name}</p>
                            <p className="text-zinc-600" style={{ fontSize: "11px" }}>{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-zinc-500/10 text-zinc-400"
                            }`}
                            style={{ fontSize: "11px", fontWeight: 600 }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400" style={{ fontSize: "13px" }}>{user.joined}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-[#0f0f14] border border-purple-500/20 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <h2
              className="text-white mb-6"
              style={{ fontFamily: "var(--font-family-heading)", fontSize: "20px", fontWeight: 700 }}
            >
              Add New {activeSection === "anime" ? "Anime" : "Manga"}
            </h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
              <div>
                <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Title</label>
                <input
                  className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-all"
                  placeholder="Enter title..."
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div>
                <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Description</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-all resize-none"
                  placeholder="Enter description..."
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Status</label>
                  <select className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white focus:outline-none focus:border-purple-500/40 transition-all" style={{ fontSize: "14px" }}>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-all"
                    placeholder="0.0"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 mb-1.5 block" style={{ fontSize: "13px", fontWeight: 500 }}>Cover Image URL</label>
                <input
                  className="w-full px-4 py-3 bg-[#14141f] border border-purple-500/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-all"
                  placeholder="https://..."
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-zinc-300 rounded-xl hover:bg-white/10 transition-all"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  Search,
  Bell,
  User,
  Menu,
  X,
  BookOpen,
  Tv,
  Home,
  LogOut,
  Shield,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", to: "/home", icon: Home },
    { label: "Anime", to: "/anime", icon: Tv },
    { label: "Manga", to: "/manga", icon: BookOpen },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#09090b]/95 backdrop-blur-xl border-b border-purple-500/10 shadow-lg shadow-purple-500/5"
          : "bg-gradient-to-b from-[#09090b]/90 to-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAuthenticated ? "/home" : "/"}
            className="flex items-center gap-2 group"
          >
            <div className="relative w-14 h-14 flex items-center justify-center">
              {/* Animated logo with infinity symbol */}
              <svg viewBox="0 -4 48 48" className="w-full h-full rounded-full">
                <defs>
                  <linearGradient
                    id="logoGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style={{ stopColor: "#8b5cf6", stopOpacity: 1 }}
                    />
                    <stop
                      offset="50%"
                      style={{ stopColor: "#a78bfa", stopOpacity: 1 }}
                    />
                    <stop
                      offset="100%"
                      style={{ stopColor: "#c4b5fd", stopOpacity: 1 }}
                    />
                  </linearGradient>
                </defs>

                {/* Infinity symbol */}
                <path
                  d="M 8 20 C 8 14 12 10 16 10 C 20 10 22 14 24 20 C 26 26 28 30 32 30 C 36 30 40 26 40 20 C 40 14 36 10 32 10 C 28 10 26 14 24 20 C 22 26 20 30 16 30 C 12 30 8 26 8 20 Z"
                  fill="url(#logoGradient)"
                  className="drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] transition-all"
                />
              </svg>
            </div>
          </Link>

          {/* Desktop Nav Links - Show for all users */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  style={{ fontSize: "14px" }}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Search */}
                <div className="relative">
                  {searchOpen ? (
                    <div className="flex items-center bg-[#14141f] border border-purple-500/20 rounded-full px-3 py-1.5 gap-2">
                      <Search size={16} className="text-purple-400" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search anime, manga..."
                        className="bg-transparent text-white outline-none w-40 sm:w-56 placeholder-zinc-500"
                        style={{ fontSize: "14px" }}
                        onBlur={() => {
                          if (!searchQuery) setSearchOpen(false);
                        }}
                      />
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <X
                          size={14}
                          className="text-zinc-500 hover:text-white"
                        />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Search size={20} />
                    </button>
                  )}
                </div>

                {/* Notifications */}
                <button className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all relative hidden sm:flex">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-purple-500/30 transition-all"
                  >
                    <img
                      src={user?.avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-purple-500/40"
                    />
                  </button>
                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-12 w-56 bg-[#14141f]/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-2xl shadow-purple-500/10 z-50 overflow-hidden">
                        <div className="p-4 border-b border-purple-500/10">
                          <p
                            className="text-white"
                            style={{ fontSize: "14px", fontWeight: 600 }}
                          >
                            {user?.username}
                          </p>
                          <p
                            className="text-zinc-500"
                            style={{ fontSize: "12px" }}
                          >
                            {user?.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              navigate("/profile");
                              setProfileOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            style={{ fontSize: "14px" }}
                          >
                            <User size={16} /> Profile
                          </button>
                          {user?.role === "ADMIN" && (
                            <button
                              onClick={() => {
                                navigate("/admin");
                                setProfileOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              style={{ fontSize: "14px" }}
                            >
                              <Shield size={16} /> Admin Panel
                            </button>
                          )}
                          <button
                            onClick={() => {
                              logout();
                              navigate("/");
                              setProfileOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all"
                            style={{ fontSize: "14px" }}
                          >
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:text-white rounded-lg transition-all hover:bg-white/5"
                  style={{ fontSize: "14px" }}
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                  style={{ fontSize: "14px" }}
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle - Show for all users */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Show for all users */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f0f14]/98 backdrop-blur-xl border-t border-purple-500/10">
          <div className="p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                style={{ fontSize: "15px" }}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

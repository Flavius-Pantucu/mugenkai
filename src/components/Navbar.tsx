"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, Bookmark, Compass, Home, LayoutDashboard, LogOut, Menu, Tv, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { SearchIndex } from "@/data/series";
import { LogoMark } from "./Logo";
import { NavSearch } from "./NavSearch";
import { NotificationBell } from "./NotificationBell";

const defaultNavLinks = [
  { label: "Home", to: "/" },
  { label: "Anime", to: "/anime" },
  { label: "Manga", to: "/manga" },
  { label: "My List", to: "/my-list" },
];

function iconFor(to: string) {
  if (to === "/") return Home;
  if (to.startsWith("/anime")) return Tv;
  if (to.startsWith("/manga")) return BookOpen;
  if (to.startsWith("/my-list")) return Bookmark;
  return Compass;
}

export function Navbar({ searchIndex }: { searchIndex: SearchIndex }) {
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const siteConfig = useSiteConfig();
  const pathname = usePathname();
  const rawLinks = siteConfig.navLinks && siteConfig.navLinks.length > 0 ? siteConfig.navLinks : defaultNavLinks;
  const navLinks = rawLinks
    .filter((l) => (l.to === "/my-list" ? isAuthenticated : true))
    .map((l) => ({
      ...l,
      icon: iconFor(l.to),
    }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (pathname.startsWith("/embed")) return null;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          scrolled ? "border-b border-white/5 bg-ink/95 backdrop-blur-xl" : "bg-gradient-to-b from-ink/70 to-transparent",
        )}
      >
        <div className="mx-auto grid h-16 w-[92%] sm:w-[90%] grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          {/* Mobile hamburger menu button + Logo */}
          <div className="flex items-center gap-1.5 sm:gap-0 justify-self-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="size-9 rounded-full text-zinc-300 hover:bg-white/10 sm:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
            <Link href="/" aria-label="Mugenkai home" className="rounded-full transition-opacity hover:opacity-90">
              <LogoMark className="h-9 w-12" />
            </Link>
          </div>

          {/* Desktop Nav Links (Hidden on mobile to avoid crowded bar) */}
          <div className="hidden sm:flex items-center justify-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.label}
                asChild
                variant="ghost"
                className={cn(
                  "px-4 text-[14px] font-normal hover:bg-white/5 hover:text-white",
                  isActive(link.to) ? "bg-white/10 text-white" : "text-zinc-400",
                )}
              >
                <Link href={link.to} aria-label={link.label} aria-current={isActive(link.to) ? "page" : undefined}>
                  <link.icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Right Actions: Search, Notifications, Account */}
          <div className="col-start-3 flex items-center gap-1.5 justify-self-end">
            <NavSearch index={searchIndex} />
            <NotificationBell />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-10 rounded-full hover:bg-white/10" aria-label="Account menu">
                    <Avatar className="size-8 ring-2 ring-primary/60">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />}
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-semibold">{user.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <LayoutDashboard className="size-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={logout} variant="destructive">
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" size="icon" className="size-10 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white">
                <Link href="/login" aria-label="Sign in or create an account">
                  <User className="size-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm sm:hidden"
              aria-hidden="true"
            />

            {/* Sidebar Slide-in */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-[101] flex w-[280px] max-w-[85vw] flex-col justify-between border-r border-white/10 bg-ink-raised p-6 shadow-2xl sm:hidden"
              aria-label="Mobile Navigation"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <Link
                    href="/"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                  >
                    <LogoMark className="h-8 w-10" />
                    <span
                      className="text-base font-black tracking-wider text-white"
                      style={{ fontFamily: "var(--font-family-heading)" }}
                    >
                      MUGENKAI
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="size-8 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                    aria-label="Close menu"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Primary Nav Links */}
                <div className="space-y-1.5">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Navigation</p>
                  {navLinks.map((link) => {
                    const active = isActive(link.to);
                    return (
                      <Link
                        key={link.label}
                        href={link.to}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all",
                          active
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <link.icon className={cn("size-5", active ? "text-primary-foreground" : "text-zinc-400")} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Account / Library links */}
                {isAuthenticated && user && (
                  <div className="space-y-1.5 pt-2">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Library</p>
                    <Link
                      href="/profile"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all",
                        pathname === "/profile"
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <User className="size-5 text-zinc-400" />
                      <span>My Profile & List</span>
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all",
                          pathname === "/admin"
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <LayoutDashboard className="size-5 text-zinc-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Footer / User actions */}
              <div className="border-t border-white/10 pt-4">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-2">
                      <Avatar className="size-9 ring-2 ring-primary/60">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />}
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                        <p className="truncate text-xs text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSidebarOpen(false);
                        logout();
                      }}
                      className="w-full justify-center gap-2 border-white/10 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button asChild className="w-full justify-center rounded-xl font-semibold">
                      <Link href="/login" onClick={() => setSidebarOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

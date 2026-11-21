"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, LayoutDashboard, LogOut, Tv, User } from "lucide-react";
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
import type { SearchIndex } from "@/data/series";
import { LogoMark } from "./Logo";
import { NavSearch } from "./NavSearch";

const navLinks = [
  { label: "Home", to: "/", icon: Home },
  { label: "Anime", to: "/anime", icon: Tv },
  { label: "Manga", to: "/manga", icon: BookOpen },
];

export function Navbar({ searchIndex }: { searchIndex: SearchIndex }) {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/embed")) return null;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled ? "border-b border-white/5 bg-ink/95 backdrop-blur-xl" : "bg-gradient-to-b from-ink/70 to-transparent",
      )}
    >
      <div className="mx-auto grid h-16 w-[90%] grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/" aria-label="Mugenkai home" className="justify-self-start rounded-full transition-opacity hover:opacity-90">
          <LogoMark className="h-9 w-12" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
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
              <Link href={link.to} aria-current={isActive(link.to) ? "page" : undefined}>
                <link.icon />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>

        <div className="col-start-3 flex items-center gap-1.5 justify-self-end">
          <NavSearch index={searchIndex} />

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
                    <User />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} variant="destructive">
                  <LogOut />
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
  );
}

/** Phones: Home / Anime / Manga / Profile within thumb reach. Hidden in the reader, which has its own bottom bar. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  if (pathname.startsWith("/read/") || pathname.startsWith("/embed")) return null;
  const tabs = [...navLinks, isAuthenticated ? { label: "Profile", to: "/profile", icon: User } : { label: "Sign in", to: "/login", icon: User }];
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid h-16 grid-cols-4">
          {tabs.map((t) => {
            const active = isActive(t.to);
            return (
              <li key={t.to}>
                <Link
                  href={t.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-zinc-400 active:text-white",
                  )}
                >
                  <t.icon className="size-5" />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, LayoutDashboard, LogOut, Menu, Tv, User } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { LogoMark } from "./Logo";
import { NavSearch } from "./NavSearch";

const navLinks = [
  { label: "Home", to: "/", icon: Home },
  { label: "Anime", to: "/anime", icon: Tv },
  { label: "Manga", to: "/manga", icon: BookOpen },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

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
          <NavSearch />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-10 rounded-full hover:bg-white/10" aria-label="Account menu">
                  <Avatar className="size-8 ring-2 ring-primary/60">
                    <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />
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

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10 rounded-full text-zinc-300 md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-white/5 bg-ink">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="space-y-1 px-4">
                {navLinks.map((link) => (
                  <Button
                    key={link.label}
                    asChild
                    variant="ghost"
                    className={cn("w-full justify-start gap-3 text-[15px]", isActive(link.to) ? "bg-white/10 text-white" : "text-zinc-300")}
                  >
                    <Link href={link.to} aria-current={isActive(link.to) ? "page" : undefined}>
                      <link.icon />
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

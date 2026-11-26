"use client";

import Link from "next/link";
import { cursorStore } from "./CustomCursor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { LogoMark } from "./Logo";

const defaultColumns = [
  {
    title: "Browse",
    links: [
      { label: "Home", href: "/" },
      { label: "Anime", href: "/anime" },
      { label: "Manga", href: "/manga" },
      { label: "My List", href: "/my-list" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "DMCA", href: "/dmca" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  const cfg = useSiteConfig();
  const columns = cfg.footerLinks && cfg.footerLinks.length > 0 ? cfg.footerLinks : defaultColumns;

  return (
    <footer className="mt-16 border-t border-white/5 bg-[#06060a]">
      <div className="mx-auto w-[90%] py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-8 w-11" />
              <span className="tracking-wider text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "16px", fontWeight: 700 }}>
                {cfg.siteName.toUpperCase()}
              </span>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500">{cfg.tagline}</p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-zinc-300">{col.title}</h4>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Button asChild variant="link" className="h-auto p-0 text-[13px] font-normal text-zinc-500 hover:text-lagoon-300">
                      <Link href={l.href}>{l.label}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator className="mt-10 bg-white/5" />
        <div className="flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row">
          <p className="text-center text-xs text-zinc-600 sm:text-left">{cfg.footerCopyright}</p>
          <CursorToggle />
        </div>
      </div>
    </footer>
  );
}

function CursorToggle() {
  const on = cursorStore.useValue();
  return (
    <button
      type="button"
      onClick={() => cursorStore.write((v) => !v)}
      aria-pressed={on}
      className="hidden text-xs text-zinc-500 underline-offset-4 hover:text-lagoon-300 hover:underline lg:block"
    >
      Glow cursor: {on ? "on" : "off"}
    </button>
  );
}

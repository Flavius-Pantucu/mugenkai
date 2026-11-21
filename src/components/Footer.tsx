import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogoMark } from "./Logo";

const columns = [
  { title: "Browse", links: [{ label: "Home", href: "/" }, { label: "Anime", href: "/anime" }, { label: "Manga", href: "/manga" }] },
  { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Create account", href: "/register" }, { label: "Profile", href: "/profile" }] },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-[#06060a]">
      <div className="mx-auto w-[90%] py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-8 w-11" />
              <span className="tracking-wider text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "16px", fontWeight: 700 }}>
                MUGENKAI
              </span>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500">
              Your gateway to limitless anime and manga. Stream, read, and discover stories that move you.
            </p>
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
        <p className="pt-6 text-center text-xs text-zinc-600 sm:text-left">
          2026 Mugenkai. Titles and artwork belong to their owners.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { cn } from "@/lib/utils";

const STYLES = {
  info: "bg-lagoon-500/15 text-lagoon-100 border-lagoon-400/25",
  success: "bg-emerald-500/15 text-emerald-100 border-emerald-400/25",
  warning: "bg-amber-500/15 text-amber-100 border-amber-400/25",
} as const;

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
} as const;

export function AnnouncementBanner() {
  const cfg = useSiteConfig();
  const [dismissed, setDismissed] = useState(false);

  if (!cfg.announcementActive || !cfg.announcementText || dismissed) return null;

  const Icon = ICONS[cfg.announcementType] ?? Info;

  return (
    <div className={cn("relative z-40 mt-16 border-b px-4 py-2 text-center text-xs sm:text-sm", STYLES[cfg.announcementType])}>
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 pr-6">
        <Icon className="size-4 shrink-0" />
        <span>{cfg.announcementText}</span>
        {cfg.announcementLink && (
          <Link href={cfg.announcementLink} className="font-medium underline underline-offset-4 hover:opacity-80">
            Learn more
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

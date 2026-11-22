"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { useList } from "@/lib/list";
import { createLocalStore } from "@/lib/local-store";
import type { Release } from "@/app/api/releases/route";

// New episodes and chapters for titles on the list (watching, planning or paused), last 8 days.
// "Unread" = released after the panel was last opened on this device.

const seenStore = createLocalStore("mugenkai:releases-seen", z.number(), 0);
const FOLLOWED = new Set(["CURRENT", "PLANNING", "PAUSED"]);

const ago = (ms: number) => {
  const m = Math.round((Date.now() - ms) / 60_000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

export function NotificationBell() {
  const { user } = useAuth();
  const list = useList();
  const seen = seenStore.useValue();
  const [releases, setReleases] = useState<Release[]>([]);
  const ids = useMemo(
    () =>
      list
        .filter((e) => FOLLOWED.has(e.status))
        .map((e) => e.seriesId)
        .slice(0, 300)
        .join(","),
    [list],
  );

  useEffect(() => {
    if (!ids) return setReleases([]);
    let live = true;
    fetch(`/api/releases?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : { releases: [] }))
      .then((d: { releases: Release[] }) => live && setReleases(d.releases))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [ids]);

  if (user && !user.notifications) return null; // turned off in profile settings
  const unread = releases.filter((r) => r.at > seen).length;

  return (
    <Popover onOpenChange={(open) => open && unread > 0 && seenStore.write(() => Date.now())}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
          aria-label={unread ? `${unread} new releases` : "New releases"}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-coral-400 px-1 text-[10px] font-bold leading-4 text-ink">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-white/5 px-4 py-3 text-[13px] font-semibold text-white">New on your list</p>
        {releases.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            {ids ? "Nothing new this week." : "Add titles to your list to hear about new episodes and chapters."}
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {releases.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/5">
                  <img src={r.cover} alt="" className="h-12 w-8 shrink-0 rounded object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-white">{r.title}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {r.label} · {ago(r.at)}
                    </span>
                  </span>
                  {r.at > seen && <span className="size-2 shrink-0 rounded-full bg-coral-400" aria-label="New" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

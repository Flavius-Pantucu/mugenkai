"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AdminData } from "@/server/admin";

const PROTECTIONS = [
  { name: "SSRF Protection", detail: "isSafePublicUrl() enforced on /api/proxy, /m3u8, /segment, /key, /ts, /subtitles" },
  { name: "Rate Limiting", detail: "Play (60/m), Download (10/m), Search (45/m), Proxy (300/m), Auth & Comments" },
  { name: "Request Guard (proxy.ts)", detail: "2 MB API body limit + Security Headers (CSP/XFO/nosniff/Referrer-Policy)" },
  { name: "CSRF & Sessions", detail: "Same-Origin write enforcement + HttpOnly SHA-256 cookie sessions" },
];

export function SecurityTab({ data }: { data: AdminData }) {
  const [filter, setFilter] = useState<string>("ALL");

  const events = useMemo(
    () => (filter === "ALL" ? data.securityEvents : data.securityEvents.filter((e) => e.type === filter)),
    [data.securityEvents, filter],
  );

  return (
    <div className="space-y-8 pt-6">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <ShieldCheck className="size-4 text-lagoon-300" />
          Active Security &amp; DDoS Controls
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROTECTIONS.map((p) => (
            <div key={p.name} className="rounded-lg bg-ink-raised/60 p-4 ring-1 ring-white/[0.06]">
              <p className="text-sm font-medium text-white">{p.name}</p>
              <p className="mt-1 text-xs text-zinc-400">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldAlert className="size-4 text-amber-300" />
            Recent Security &amp; Audit Events
          </h2>
          <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)} variant="outline" size="sm">
            <ToggleGroupItem value="ALL">All</ToggleGroupItem>
            <ToggleGroupItem value="RATE_LIMIT">Rate Limits</ToggleGroupItem>
            <ToggleGroupItem value="SSRF_BLOCKED">SSRF</ToggleGroupItem>
            <ToggleGroupItem value="AUTH_FAIL">Auth Fails</ToggleGroupItem>
            <ToggleGroupItem value="ADMIN_ACTION">Admin</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead>Type</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-zinc-400">
                    No security events recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {events.map((e) => (
                <TableRow key={e.id} className="border-white/[0.06]">
                  <TableCell>
                    <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-lagoon-200">{e.type}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300">{e.ip}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">{e.path}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-zinc-300">{e.detail ?? "—"}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-zinc-400">
                    {new Date(e.createdAt).toLocaleString("en-GB", { timeZone: "UTC" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

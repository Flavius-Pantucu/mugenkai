"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Ban,
  Eye,
  LogOut,
  MessageSquareOff,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  banUser,
  deleteUser,
  getUserDetailsForAdmin,
  muteUser,
  runSync,
  setUserRole,
  signOutUser,
  unbanUser,
} from "@/app/admin/actions";
import { CatalogManagerTab } from "@/components/admin/CatalogManagerTab";
import { ModerationTab } from "@/components/admin/ModerationTab";
import { SecurityTab } from "@/components/admin/SecurityTab";
import { SiteCmsTab } from "@/components/admin/SiteCmsTab";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { AdminData } from "@/server/admin";

type User = AdminData["users"][number];
type Job = AdminData["jobs"][number];
type UserDetails = Awaited<ReturnType<typeof getUserDetailsForAdmin>>;

const JOBS = [
  { job: "catalog", what: "Top anime and manga: seasons, episodes, official links", schedule: "daily 04:00", staleAfterH: 48 },
  { job: "manga", what: "Chapters for every manga in the catalog", schedule: "daily 04:30", staleAfterH: 48 },
  { job: "airing", what: "New episodes for seasons that are airing", schedule: "hourly :15", staleAfterH: 2 },
  { job: "search", what: "Search index of every title: new and edited titles", schedule: "hourly :45", staleAfterH: 2 },
] as const;

const fmtDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtFull = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const fmtNum = new Intl.NumberFormat("en-US");

function ago(iso: string | null, now: string) {
  if (!iso) return "never";
  const s = (Date.parse(now) - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 30 * 86_400) return `${Math.floor(s / 86_400)} d ago`;
  return fmtDate.format(new Date(iso));
}

const fullTime = (iso: string | null) => (iso ? `${fmtFull.format(new Date(iso))} UTC` : undefined);

export function AdminPage({ data }: { data: AdminData | null }) {
  if (!data) {
    return (
      <div className="min-h-screen bg-ink pt-16">
        <div className="mx-auto max-w-xl px-4 py-24">
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="mt-3 text-pretty text-zinc-400">
            The admin console reads the database, and this deployment runs without one. Set <code className="text-lagoon-200">DATABASE_URL</code> and{" "}
            <code className="text-lagoon-200">CRON_SECRET</code>, then sign in with an address listed in{" "}
            <code className="text-lagoon-200">ADMIN_EMAILS</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Console</h1>
            <p className="mt-1 text-sm text-zinc-400">Manage site content, catalog metadata, users, moderation, sync jobs, and security.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
            <span>{fmtNum.format(data.counts.anime + data.counts.manga)} series</span>
            <span>·</span>
            <span>{fmtNum.format(data.users.length)} users</span>
            <span>·</span>
            <span className={cn(data.counts.openReportCount > 0 && "text-amber-300")}>
              {data.counts.openReportCount} open reports
            </span>
          </div>
        </header>

        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-ink-raised/70 p-1 ring-1 ring-white/[0.06]">
            <TabsTrigger value="sync">Sync &amp; Overview</TabsTrigger>
            <TabsTrigger value="cms">Site &amp; CMS</TabsTrigger>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="moderation">
              Moderation {data.counts.openReportCount > 0 ? `(${data.counts.openReportCount})` : ""}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="sync">
            <SyncSection data={data} />
          </TabsContent>
          <TabsContent value="cms">
            <SiteCmsTab initial={data.siteConfig} />
          </TabsContent>
          <TabsContent value="catalog">
            <CatalogManagerTab data={data} />
          </TabsContent>
          <TabsContent value="moderation">
            <ModerationTab data={data} />
          </TabsContent>
          <TabsContent value="users">
            <UsersSection data={data} />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Sync ────────────────────────────────────────────────────────────────────

type Health = "ok" | "failed" | "stale" | "never" | "running";
const HEALTH: Record<Health, { label: string; dot: string; text: string }> = {
  ok: { label: "Healthy", dot: "bg-lagoon-400", text: "text-lagoon-200" },
  failed: { label: "Failed", dot: "bg-red-400", text: "text-red-300" },
  stale: { label: "Stale", dot: "bg-amber-400", text: "text-amber-200" },
  never: { label: "Never run", dot: "bg-zinc-500", text: "text-zinc-400" },
  running: { label: "Running", dot: "bg-lagoon-300 animate-pulse", text: "text-lagoon-200" },
};

function health(state: Job | undefined, staleAfterH: number, now: string): Health {
  if (!state?.lastRunAt) return "never";
  if (state.lastError) return "failed";
  if (!state.lastOkAt || Date.parse(now) - Date.parse(state.lastOkAt) > staleAfterH * 3_600_000) return "stale";
  return "ok";
}

function SyncSection({ data }: { data: AdminData }) {
  const [running, setRunning] = useState<string | null>(null);
  const states = JOBS.map((j) => health(data.jobs.find((s) => s.job === j.job), j.staleAfterH, data.now));
  const problems = states.filter((h) => h === "failed" || h === "stale").length;

  const run = async (job: string) => {
    setRunning(job);
    try {
      const r = await runSync(job);
      if (r.ok) toast.success(`${job} finished in ${Math.max(1, Math.round(r.ms / 1000))} s`);
      else toast.error(`${job} failed`, { description: r.error });
    } catch (err) {
      toast.error(`Couldn't start ${job}`, { description: err instanceof Error ? err.message : undefined });
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Series" value={fmtNum.format(data.counts.anime + data.counts.manga)} sub={`${data.counts.anime} anime · ${data.counts.manga} manga`} />
        <KpiCard label="Episodes & Chapters" value={fmtNum.format(data.counts.episodes + data.counts.chapters)} sub={`${data.counts.episodes} ep · ${data.counts.chapters} ch`} />
        <KpiCard label="Active Comments" value={fmtNum.format(data.counts.activeComments)} sub={`${data.counts.openReportCount} open reports`} />
        <KpiCard label="Sync Health" value={problems === 0 ? "Healthy" : `${problems} issue(s)`} sub={data.siteConfig.maintenanceMode ? "Maintenance ON" : "Site live"} />
      </div>

      <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
        {JOBS.map((j, i) => {
          const state = data.jobs.find((s) => s.job === j.job);
          const h = HEALTH[running === j.job ? "running" : states[i]];
          return (
            <li key={j.job} className="bg-ink-raised/60 px-4 py-3.5">
              <div className="grid items-center gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_9rem_8rem_auto]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-white">{j.job}</span>
                    <span className={cn("inline-flex items-center gap-1.5 text-xs", h.text)}>
                      <span aria-hidden className={cn("size-1.5 rounded-full", h.dot)} />
                      {h.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-zinc-400">{j.what}</p>
                </div>
                <Field label="Schedule" value={`${j.schedule} UTC`} />
                <Field label="Last success" value={ago(state?.lastOkAt ?? null, data.now)} title={fullTime(state?.lastOkAt ?? null)} />
                <Button size="sm" variant="outline" disabled={running !== null} onClick={() => run(j.job)} className="justify-self-start sm:justify-self-end">
                  <RefreshCw className={cn(running === j.job && "animate-spin")} />
                  {running === j.job ? "Running…" : "Run now"}
                </Button>
              </div>
              {state?.summary && !state.lastError && <Summary summary={state.summary} />}
              {state?.lastError && (
                <p className="mt-3 rounded-md bg-red-500/[0.08] px-3 py-2 font-mono text-xs leading-relaxed text-red-200 ring-1 ring-red-400/20 [overflow-wrap:anywhere]">
                  <span className="text-red-300">Failed {ago(state.lastRunAt, data.now)}:</span> {state.lastError}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-ink-raised/60 p-4 ring-1 ring-white/[0.06]">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function Field({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px] sm:block">
      <span className="text-zinc-400 sm:block sm:text-[11px] sm:uppercase sm:tracking-wide">{label}</span>
      <span className="tabular-nums text-zinc-200" title={title}>
        {value}
      </span>
    </div>
  );
}

function Summary({ summary }: { summary: Record<string, unknown> }) {
  const parts = Object.entries(summary).filter(([, v]) => typeof v === "number" || typeof v === "string");
  if (parts.length === 0) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
      {parts.map(([k, v]) => (
        <span key={k}>
          <span className="tabular-nums text-zinc-300">{typeof v === "number" ? fmtNum.format(v) : String(v)}</span>{" "}
          {k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}
        </span>
      ))}
    </p>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

function UsersSection({ data }: { data: AdminData }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ADMIN" | "BANNED" | "MUTED">("all");
  const [deleting, setDeleting] = useState<User | null>(null);
  const [inspecting, setInspecting] = useState<User | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [pending, start] = useTransition();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.users.filter((u) => {
      if (filter === "ADMIN" && u.role !== "ADMIN") return false;
      if (filter === "BANNED" && !u.bannedAt) return false;
      if (filter === "MUTED" && (!u.mutedUntil || Date.parse(u.mutedUntil) <= Date.parse(data.now))) return false;
      return !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [data.users, data.now, query, filter]);

  const inspectUser = (u: User) => {
    setInspecting(u);
    setDetails(null);
    start(async () => {
      try {
        setDetails(await getUserDetailsForAdmin(u.id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load user details");
      }
    });
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" aria-label="Search users" className="h-9 pl-8" />
        </div>
        <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)} variant="outline" size="sm">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="ADMIN">Admins</ToggleGroupItem>
          <ToggleGroupItem value="BANNED">Banned</ToggleGroupItem>
          <ToggleGroupItem value="MUTED">Muted</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">List</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center text-sm text-zinc-400">
                  No accounts match that filter.
                </TableCell>
              </TableRow>
            )}
            {rows.map((u) => {
              const isMuted = u.mutedUntil && Date.parse(u.mutedUntil) > Date.parse(data.now);
              return (
                <TableRow key={u.id} className="border-white/[0.06]">
                  <TableCell className="max-w-64">
                    <p className="truncate font-medium text-white">
                      {u.username}
                      {u.id === data.meId && <span className="ml-2 text-xs font-normal text-zinc-400">you</span>}
                    </p>
                    <p className="truncate text-xs text-zinc-400">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-lagoon-200">
                          <ShieldCheck className="size-3.5" />
                          Admin
                        </span>
                      )}
                      {u.bannedAt && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-xs text-red-300">Banned</span>}
                      {isMuted && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-200">Muted</span>}
                      {u.role !== "ADMIN" && !u.bannedAt && !isMuted && <span className="text-xs text-zinc-400">Active</span>}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums text-zinc-400">{fmtDate.format(new Date(u.createdAt))}</TableCell>
                  <TableCell className="tabular-nums text-zinc-400" title={fullTime(u.lastSignIn)}>
                    {ago(u.lastSignIn, data.now)}
                  </TableCell>
                  <Count n={u.list} />
                  <Count n={u.progress} />
                  <Count n={u.comments} />
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => inspectUser(u)} title="Inspect user details">
                        <Eye className="size-4" />
                      </Button>
                      {u.id !== data.meId && <UserActions user={u} isMuted={Boolean(isMuted)} onDelete={() => setDeleting(u)} />}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />
      <UserDetailsDialog user={inspecting} details={details} loading={pending && inspecting !== null && details === null} onClose={() => setInspecting(null)} />
    </div>
  );
}

const Count = ({ n }: { n: number }) => (
  <TableCell className={cn("text-right tabular-nums", n === 0 ? "text-zinc-500" : "text-zinc-300")}>{fmtNum.format(n)}</TableCell>
);

function useAction() {
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<void>, done: string) =>
    start(async () => {
      try {
        await fn();
        toast.success(done);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "That didn't work. Try again.");
      }
    });
  return { pending, act };
}

function UserActions({ user, isMuted, onDelete }: { user: User; isMuted: boolean; onDelete: () => void }) {
  const { pending, act } = useAction();
  const admin = user.role === "ADMIN";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label={`Actions for ${user.username}`}>
          {pending ? <RefreshCw className="animate-spin" /> : <MoreHorizontal />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() =>
            act(() => setUserRole(user.id, admin ? "USER" : "ADMIN"), admin ? `${user.username} is no longer an admin` : `${user.username} is now an admin`)
          }
        >
          {admin ? <ShieldOff /> : <ShieldCheck />}
          {admin ? "Remove admin" : "Make admin"}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!user.lastSignIn} onSelect={() => act(() => signOutUser(user.id), `${user.username} was signed out everywhere`)}>
          <LogOut />
          Sign out everywhere
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isMuted ? (
          <DropdownMenuItem onSelect={() => act(() => muteUser(user.id, 0), `Unmuted ${user.username}`)}>
            <MessageSquareOff />
            Unmute comments
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => act(() => muteUser(user.id, 24), `Muted ${user.username} for 24h`)}>
            <MessageSquareOff />
            Mute comments (24h)
          </DropdownMenuItem>
        )}
        {user.bannedAt ? (
          <DropdownMenuItem onSelect={() => act(() => unbanUser(user.id), `Unbanned ${user.username}`)}>
            <ShieldAlert />
            Unban account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onSelect={() => act(() => banUser(user.id, "Suspended by administrator"), `Banned ${user.username}`)}>
            <Ban />
            Ban account
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Delete account…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserDetailsDialog({
  user,
  details,
  loading,
  onClose,
}: {
  user: User | null;
  details: UserDetails | null;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user?.username} — Account Details</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        {loading || !details ? (
          <p className="py-8 text-center text-sm text-zinc-400">Loading user activity…</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-white/[0.03] p-3 text-xs">
              <div>
                <p className="text-zinc-400">Active Sessions</p>
                <p className="mt-1 text-base font-semibold text-white">{details.sessions.length}</p>
              </div>
              <div>
                <p className="text-zinc-400">Episode Progress</p>
                <p className="mt-1 text-base font-semibold text-white">{details.epProgress}</p>
              </div>
              <div>
                <p className="text-zinc-400">Chapter Progress</p>
                <p className="mt-1 text-base font-semibold text-white">{details.chProgress}</p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Recent List Entries ({details.list.length})</h4>
              <ul className="max-h-40 divide-y divide-white/[0.06] overflow-y-auto text-xs">
                {details.list.map((l) => (
                  <li key={l.series.id} className="flex justify-between py-1.5">
                    <span className="text-zinc-200">{l.series.title}</span>
                    <span className="text-zinc-400">
                      {l.status} {l.score ? `· ${l.score}/10` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Recent Comments ({details.comments.length})</h4>
              <ul className="max-h-40 divide-y divide-white/[0.06] overflow-y-auto text-xs">
                {details.comments.map((c) => (
                  <li key={c.id} className="py-1.5">
                    <span className="text-lagoon-200">{c.threadId}:</span>{" "}
                    <span className="text-zinc-300">{c.deletedAt ? "[deleted]" : c.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { pending, act } = useAction();
  const comments = user?.comments ?? 0;
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {user?.username}?</DialogTitle>
          <DialogDescription>
            This removes the account, its list and its progress
            {comments > 0 ? `, plus ${comments === 1 ? "1 comment" : `${comments} comments`} and any replies under them` : ""}. It can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Keep account
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              user &&
              act(async () => {
                await deleteUser(user.id);
                onClose();
              }, `${user.username} was deleted`)
            }
          >
            {pending ? "Deleting…" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

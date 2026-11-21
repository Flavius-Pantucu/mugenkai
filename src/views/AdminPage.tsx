"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, LogOut, MoreHorizontal, RefreshCw, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { deleteUser, runSync, setUserRole, signOutUser } from "@/app/admin/actions";
import type { AdminData } from "@/server/admin";

type User = AdminData["users"][number];
type Job = AdminData["jobs"][number];

/** Order, schedule and what "stale" means for each job (twice its interval without a success). */
const JOBS = [
  { job: "catalog", what: "Top anime and manga: seasons, episodes, official links", schedule: "daily 04:00", staleAfterH: 48 },
  { job: "manga", what: "Chapters for every manga in the catalog", schedule: "daily 04:30", staleAfterH: 48 },
  { job: "airing", what: "New episodes for seasons that are airing", schedule: "hourly :15", staleAfterH: 2 },
  { job: "search", what: "Search index of every title: new and edited titles", schedule: "hourly :45", staleAfterH: 2 },
] as const;

// Fixed locale and zone so server and browser render identical text.
const fmtDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtFull = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const fmtNum = new Intl.NumberFormat("en-US");

/** "4 min ago" relative to the server's render time, so hydration matches. */
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
            <code className="text-lagoon-200">CRON_SECRET</code> (see <code className="text-lagoon-200">.env.example</code>), then sign in with an
            address listed in <code className="text-lagoon-200">ADMIN_EMAILS</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-2 pt-8">
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <nav aria-label="Sections" className="flex gap-1 text-sm">
            {["Sync", "Catalog", "Users"].map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`} className="rounded-md px-2.5 py-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
                {s}
              </a>
            ))}
          </nav>
        </header>

        <SyncSection data={data} />
        <CatalogSection data={data} />
        <UsersSection data={data} />
      </div>
    </div>
  );
}

function Section({ id, title, meta, children }: { id: string; title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-8 scroll-mt-20 border-t border-white/[0.06] pt-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`${id}-title`} className="text-lg font-semibold text-white">
          {title}
        </h2>
        {meta && <div className="text-sm text-zinc-400">{meta}</div>}
      </div>
      {children}
    </section>
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
    <Section
      id="sync"
      title="Sync"
      meta={problems === 0 ? "All jobs healthy" : <span className="text-amber-200">{problems === 1 ? "1 job needs attention" : `${problems} jobs need attention`}</span>}
    >
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
    </Section>
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

/** The job's last result, e.g. { anime: 50, seasons: 126 }. Only flat numbers and strings are shown. */
function Summary({ summary }: { summary: Record<string, unknown> }) {
  const parts = Object.entries(summary).filter(([, v]) => typeof v === "number" || typeof v === "string");
  if (parts.length === 0) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
      {parts.map(([k, v]) => (
        <span key={k}>
          <span className="tabular-nums text-zinc-300">{typeof v === "number" ? fmtNum.format(v) : String(v)}</span> {k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}
        </span>
      ))}
    </p>
  );
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

function CatalogSection({ data }: { data: AdminData }) {
  const c = data.counts;
  const { mangaWithoutChapters, animeWithoutLinks, airing } = data.gaps;
  const totals = [
    [c.anime, "anime"],
    [c.seasons, "seasons"],
    [c.episodes, "episodes"],
    [c.manga, "manga"],
    [c.chapters, "chapters"],
    [c.links, "streaming links"],
  ] as const;

  return (
    <Section id="catalog" title="Catalog">
      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-3">
        {totals.map(([n, label]) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-xs text-zinc-400">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums text-white">{fmtNum.format(n)}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-3">
        <GapList
          title="Manga without chapters"
          why="No chapter source matched, or no English chapters. The reader has nothing to show."
          empty="Every manga has chapters."
          items={mangaWithoutChapters.map((m) => ({ id: m.id, href: `/manga/${m.id}`, title: m.title, meta: String(m.year) }))}
        />
        <GapList
          title="Anime without streaming links"
          why="No official stream is listed. The watch page has nowhere to send people."
          empty="Every anime has a streaming link."
          items={animeWithoutLinks.map((a) => ({ id: a.id, href: `/anime/${a.id}`, title: a.title, meta: String(a.year) }))}
        />
        <GapList
          title="Airing now"
          why="Seasons the hourly airing job checks for new episodes."
          empty="Nothing in the catalog is airing."
          neutral
          items={airing.map((s) => ({
            id: s.id,
            href: `/anime/${s.series.id}`,
            title: s.number > 1 ? `${s.series.title} · S${s.number}` : s.series.title,
            meta: `${s.episodeCount} ep`,
          }))}
        />
      </div>
    </Section>
  );
}

function GapList({
  title,
  why,
  empty,
  items,
  neutral,
}: {
  title: string;
  why: string;
  empty: string;
  items: { id: string; href: string; title: string; meta: string }[];
  neutral?: boolean;
}) {
  return (
    <div className="min-w-0">
      <h3 className="flex items-baseline gap-2 text-sm font-medium text-white">
        {title}
        <span className={cn("tabular-nums", items.length > 0 && !neutral ? "text-amber-200" : "text-zinc-400")}>{items.length}</span>
      </h3>
      <p className="mt-1 text-[13px] leading-snug text-zinc-400">{why}</p>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-lagoon-200">
          <Check className="size-3.5" />
          {empty}
        </p>
      ) : (
        <ul className="mt-3 max-h-72 divide-y divide-white/[0.05] overflow-y-auto border-y border-white/[0.06]">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="flex items-baseline justify-between gap-3 px-1 py-2 text-[13px] transition-colors hover:bg-white/[0.03]">
                <span className="truncate text-zinc-200">{it.title}</span>
                <span className="shrink-0 tabular-nums text-zinc-400">{it.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

function UsersSection({ data }: { data: AdminData }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | "ADMIN">("all");
  const [deleting, setDeleting] = useState<User | null>(null);
  const admins = data.users.filter((u) => u.role === "ADMIN").length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.users.filter(
      (u) => (role === "all" || u.role === role) && (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [data.users, query, role]);

  return (
    <Section
      id="users"
      title="Users"
      meta={`${fmtNum.format(data.users.length)} ${data.users.length === 1 ? "account" : "accounts"} · ${admins} ${admins === 1 ? "admin" : "admins"}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" aria-label="Search users" className="h-9 pl-8" />
        </div>
        <ToggleGroup type="single" value={role} onValueChange={(v) => v && setRole(v as typeof role)} variant="outline" size="sm" aria-label="Role">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="ADMIN">Admins</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">List</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead className="text-right">Comments</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center text-sm text-zinc-400">
                  {data.users.length === 0 ? "No accounts yet. They appear here as people register." : "No account matches that search."}
                </TableCell>
              </TableRow>
            )}
            {rows.map((u) => (
              <TableRow key={u.id} className="border-white/[0.06]">
                <TableCell className="max-w-64">
                  <p className="truncate font-medium text-white">
                    {u.username}
                    {u.id === data.meId && <span className="ml-2 text-xs font-normal text-zinc-400">you</span>}
                  </p>
                  <p className="truncate text-xs text-zinc-400">{u.email}</p>
                </TableCell>
                <TableCell>
                  {u.role === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-lagoon-200">
                      <ShieldCheck className="size-3.5" />
                      Admin
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">User</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums text-zinc-400">{fmtDate.format(new Date(u.createdAt))}</TableCell>
                <TableCell className="tabular-nums text-zinc-400" title={fullTime(u.lastSignIn)}>
                  {ago(u.lastSignIn, data.now)}
                </TableCell>
                <Count n={u.list} />
                <Count n={u.progress} />
                <Count n={u.comments} />
                <TableCell className="text-right">{u.id !== data.meId && <UserActions user={u} onDelete={() => setDeleting(u)} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />
    </Section>
  );
}

const Count = ({ n }: { n: number }) => (
  <TableCell className={cn("text-right tabular-nums", n === 0 ? "text-zinc-500" : "text-zinc-300")}>{fmtNum.format(n)}</TableCell>
);

/** Runs a server action with a pending flag and a toast either way. */
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

function UserActions({ user, onDelete }: { user: User; onDelete: () => void }) {
  const { pending, act } = useAction();
  const admin = user.role === "ADMIN";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label={`Actions for ${user.username}`}>
          {pending ? <RefreshCw className="animate-spin" /> : <MoreHorizontal />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
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
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Delete account…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, EyeOff, Flag, RotateCcw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteComment, adminRestoreComment, adminToggleSpoiler, resolveReport } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AdminData } from "@/server/admin";

export function ModerationTab({ data }: { data: AdminData }) {
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const filteredComments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.comments;
    return data.comments.filter(
      (c) =>
        c.body.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.threadId.toLowerCase().includes(q),
    );
  }, [data.comments, query]);

  const act = (fn: () => Promise<void>, okMsg: string) =>
    start(async () => {
      try {
        await fn();
        toast.success(okMsg);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });

  return (
    <div className="space-y-8 pt-6">
      {/* Open Reports */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Flag className="size-4 text-amber-300" />
            Open Comment Reports
            <span className="text-sm font-normal text-zinc-400">({data.reports.length})</span>
          </h2>
        </div>

        {data.reports.length === 0 ? (
          <p className="rounded-lg bg-ink-raised/60 px-4 py-6 text-sm text-zinc-400 ring-1 ring-white/[0.06]">
            No open comment reports.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
            {data.reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 bg-ink-raised/60 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-medium text-white">{r.authorName}</span>
                    <span>in</span>
                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-lagoon-200">{r.threadId}</code>
                    <span className="text-amber-300">Reason: {r.reason}</span>
                  </div>
                  <p className="text-sm text-zinc-200">{r.commentDeleted ? "[deleted]" : r.commentBody}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!r.commentDeleted && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => act(() => adminDeleteComment(r.commentId), "Comment removed & report resolved")}
                    >
                      <Trash2 className="size-3.5" />
                      Remove comment
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => act(() => resolveReport(r.id, "DISMISSED"), "Report dismissed")}
                  >
                    <X className="size-3.5" />
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Comments */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Recent Comments</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search body, user, thread"
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead>Author</TableHead>
                <TableHead>Thread</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-zinc-400">
                    No comments found.
                  </TableCell>
                </TableRow>
              )}
              {filteredComments.map((c) => {
                const deleted = c.deletedAt !== null;
                return (
                  <TableRow key={c.id} className={cn("border-white/[0.06]", deleted && "opacity-60")}>
                    <TableCell className="font-medium text-white">{c.authorName}</TableCell>
                    <TableCell>
                      <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-zinc-300">{c.threadId}</code>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm text-zinc-200">{c.body}</p>
                    </TableCell>
                    <TableCell className="space-x-1.5 text-xs">
                      {c.spoiler && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200">Spoiler</span>}
                      {deleted && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-200">Deleted</span>}
                      {c.reports > 0 && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-200">{c.reports} reports</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title={c.spoiler ? "Unmark spoiler" : "Mark spoiler"}
                          disabled={pending}
                          onClick={() => act(() => adminToggleSpoiler(c.id, !c.spoiler), "Spoiler flag updated")}
                        >
                          <EyeOff className="size-4" />
                        </Button>
                        {deleted ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Restore comment"
                            disabled={pending}
                            onClick={() => act(() => adminRestoreComment(c.id), "Comment restored")}
                          >
                            <RotateCcw className="size-4 text-lagoon-300" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Soft-delete comment"
                            disabled={pending}
                            onClick={() => act(() => adminDeleteComment(c.id, false), "Comment soft-deleted")}
                          >
                            <Check className="size-4 text-amber-300" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Permanently delete"
                          disabled={pending}
                          onClick={() => act(() => adminDeleteComment(c.id, true), "Comment permanently deleted")}
                        >
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CommentsStateSchema, type ApiComment, type Comment, type CommentInput, type CommentsState } from "@/data/schema";
import { api } from "./api";
import { createLocalStore } from "./local-store";

// Threaded comments. With a backend: the API (src/app/api/comments). Demo mode: browser storage
// plus deterministic seed comments. Both produce the same flat list → same tree builder.

export interface ThreadComment extends ApiComment {
  replies: ThreadComment[];
}

export type CommentSort = "newest" | "top";
type Author = Comment["author"];

/** Flat list → tree. Top level sorted by `sort`, replies oldest first; deleted leaves are dropped. */
export function buildTree(flat: ApiComment[], sort: CommentSort): ThreadComment[] {
  const nodes = new Map<string, ThreadComment>(flat.map((c) => [c.id, { ...c, replies: [] }]));
  const roots: ThreadComment[] = [];
  for (const n of nodes.values()) {
    const parent = n.parentId ? nodes.get(n.parentId) : undefined;
    (parent ? parent.replies : roots).push(n); // orphaned replies surface at the top level
  }
  const prune = (list: ThreadComment[]): ThreadComment[] =>
    list.flatMap((n) => {
      n.replies = prune(n.replies).sort((a, b) => a.createdAt - b.createdAt);
      return n.removed && n.replies.length === 0 ? [] : [n];
    });
  return prune(roots).sort((a, b) => (sort === "top" ? b.likes - a.likes : 0) || b.createdAt - a.createdAt);
}

/** Visible comments in a tree, replies included. */
export const countComments = (list: ThreadComment[]): number => list.reduce((n, c) => n + (c.removed ? 0 : 1) + countComments(c.replies), 0);

// ─── Demo mode: browser storage + seeds ──────────────────────────────────────

const EMPTY: CommentsState = { posted: [], liked: [], deleted: [] };
const store = createLocalStore("mugenkai:comments", CommentsStateSchema, EMPTY);

// ponytail: mock seed data so demo threads don't open empty; unused once a database is configured.
const SEED_AUTHORS = ["AkiraFan42", "MangaLover99", "NeonKnight", "SakuraWind", "RamenRonin", "KuroNeko", "TatamiGhost"];
const SEED_BODIES: { body: string; spoiler?: boolean }[] = [
  { body: "This is peak. No notes." },
  { body: "Rewatching this for the third time and it still hits." },
  { body: "The pacing here is so much better than I remembered." },
  { body: "Honestly underrated. More people need to see this." },
  { body: "The soundtrack carries every big moment." },
  { body: "I did not expect them to kill off the mentor that early.", spoiler: true },
  { body: "That last scene reframes the whole thing. Chills.", spoiler: true },
  { body: "Art style took a moment to grow on me, now I love it." },
  { body: "Can't wait for the next one." },
];
const SEED_REPLIES = ["Agreed, 100%.", "Hard disagree, the first half drags.", "Same here!", "Wait until you see what comes next.", "This comment needs more likes."];
const SEED_BASE = Date.UTC(2026, 10, 15);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seedComments(threadId: string): Comment[] {
  const h = hash(threadId);
  return Array.from({ length: h % 5 }, (_, i) => {
    const k = hash(`${threadId}:${i}`);
    const pick = SEED_BODIES[k % SEED_BODIES.length];
    const parent: Comment = {
      id: `seed-${h.toString(36)}-${i}`,
      threadId,
      parentId: null,
      author: { name: SEED_AUTHORS[(k >>> 3) % SEED_AUTHORS.length], avatarUrl: null },
      body: pick.body,
      spoiler: pick.spoiler ?? false,
      likes: (k >>> 5) % 140,
      createdAt: SEED_BASE - ((k >>> 7) % (60 * 24 * 40)) * 60_000,
    };
    const replies = Array.from({ length: (k >>> 11) % 3 }, (_, j): Comment => {
      const r = hash(`${parent.id}:${j}`);
      return {
        id: `${parent.id}-r${j}`,
        threadId,
        parentId: parent.id,
        author: { name: SEED_AUTHORS[r % SEED_AUTHORS.length], avatarUrl: null },
        body: SEED_REPLIES[(r >>> 3) % SEED_REPLIES.length],
        spoiler: false,
        likes: (r >>> 5) % 30,
        createdAt: parent.createdAt + (1 + ((r >>> 7) % 600)) * 60_000 * (j + 1),
      };
    });
    return [parent, ...replies];
  }).flat();
}

function demoFlat(s: CommentsState, threadId: string, me: string | undefined): ApiComment[] {
  const deleted = new Set(s.deleted);
  const posted = s.posted.filter((c) => c.threadId === threadId);
  const postedIds = new Set(posted.map((c) => c.id));
  return [...seedComments(threadId), ...posted].map((c) => {
    const likedByMe = s.liked.includes(c.id);
    return { ...c, likes: c.likes + (likedByMe ? 1 : 0), likedByMe, mine: postedIds.has(c.id) && c.author.name === me, removed: deleted.has(c.id) };
  });
}

// ─── One hook for both modes ─────────────────────────────────────────────────

export function useThread(threadId: string, opts: { backend: boolean; me: Author | null; sort: CommentSort }) {
  const { backend, me, sort } = opts;
  const local = store.useValue();
  const [remote, setRemote] = useState<ApiComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backend) return;
    let cancelled = false;
    setRemote(null);
    setError(null);
    api<{ comments: ApiComment[] }>(`/api/comments?thread=${encodeURIComponent(threadId)}`)
      .then((r) => !cancelled && setRemote(r.comments))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [backend, threadId, me?.name]);

  const comments = useMemo(
    () => buildTree(backend ? (remote ?? []) : demoFlat(local, threadId, me?.name), sort),
    [backend, remote, local, threadId, me?.name, sort],
  );

  const post = useCallback(
    async (input: CommentInput, parentId: string | null) => {
      if (!me) return;
      if (!backend) {
        const comment: Comment = { id: crypto.randomUUID(), threadId, parentId, author: me, body: input.body.trim(), spoiler: input.spoiler, likes: 0, createdAt: Date.now() };
        store.write((s) => ({ ...s, posted: [...s.posted, comment] }));
        return;
      }
      const { comment } = await api<{ comment: ApiComment }>("/api/comments", { body: { ...input, threadId, parentId } });
      setRemote((cur) => [...(cur ?? []), comment]);
    },
    [backend, me, threadId],
  );

  const like = useCallback(
    async (id: string) => {
      if (!backend) {
        store.write((s) => ({ ...s, liked: s.liked.includes(id) ? s.liked.filter((x) => x !== id) : [...s.liked, id] }));
        return;
      }
      const r = await api<{ liked: boolean; likes: number }>(`/api/comments/${id}/like`, { body: {} });
      setRemote((cur) => cur?.map((c) => (c.id === id ? { ...c, likedByMe: r.liked, likes: r.likes } : c)) ?? cur);
    },
    [backend],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!backend) {
        store.write((s) => ({ ...s, deleted: s.deleted.includes(id) ? s.deleted : [...s.deleted, id] }));
        return;
      }
      await api(`/api/comments/${id}`, { method: "DELETE" });
      setRemote((cur) => cur?.map((c) => (c.id === id ? { ...c, removed: true, mine: false, body: "[deleted]" } : c)) ?? cur);
    },
    [backend],
  );

  return { comments, total: countComments(comments), loading: backend && remote === null && !error, error, post, like, remove };
}

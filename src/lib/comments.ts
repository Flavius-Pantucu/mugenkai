"use client";

import { CommentsStateSchema, type Comment, type CommentInput, type CommentsState } from "@/data/schema";
import { createLocalStore } from "./local-store";

const EMPTY: CommentsState = { posted: [], liked: [], deleted: [] };
const store = createLocalStore("mugenkai:comments", CommentsStateSchema, EMPTY);

export const useComments = store.useValue;

// --- Seed comments so threads don't open empty. Deterministic per thread (no Math.random). ---
// ponytail: mock data; delete once comments come from the API.
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
      createdAt: SEED_BASE - ((k >>> 7) % (60 * 24 * 40)) * 60_000, // up to 40 days back
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

export interface ThreadComment extends Comment {
  likedByMe: boolean;
  mine: boolean;
  /** Deleted but kept as a placeholder because others replied to it. */
  removed: boolean;
  replies: ThreadComment[];
}

export type CommentSort = "newest" | "top";

/** Comments of one thread as a tree: top level sorted by `sort`, replies oldest first (reads as a conversation). */
export function threadComments(s: CommentsState, threadId: string, me: string | undefined, sort: CommentSort): ThreadComment[] {
  const deleted = new Set(s.deleted);
  const posted = new Set(s.posted.filter((c) => c.threadId === threadId).map((c) => c.id));
  const all = [...seedComments(threadId), ...s.posted.filter((c) => c.threadId === threadId)];

  const nodes = new Map<string, ThreadComment>(
    all.map((c) => {
      const likedByMe = s.liked.includes(c.id);
      return [c.id, { ...c, likes: c.likes + (likedByMe ? 1 : 0), likedByMe, mine: posted.has(c.id) && c.author.name === me, removed: deleted.has(c.id), replies: [] }];
    }),
  );

  const roots: ThreadComment[] = [];
  for (const n of nodes.values()) {
    const parent = n.parentId ? nodes.get(n.parentId) : undefined;
    (parent ? parent.replies : roots).push(n); // orphaned replies surface at the top level
  }

  // Drop deleted comments nobody answered; keep the rest as placeholders.
  const prune = (list: ThreadComment[]): ThreadComment[] =>
    list.flatMap((n) => {
      n.replies = prune(n.replies).sort((a, b) => a.createdAt - b.createdAt);
      return n.removed && n.replies.length === 0 ? [] : [n];
    });

  return prune(roots).sort((a, b) => (sort === "top" ? b.likes - a.likes : 0) || b.createdAt - a.createdAt);
}

/** Visible comments in a tree, replies included. */
export const countComments = (list: ThreadComment[]): number => list.reduce((n, c) => n + (c.removed ? 0 : 1) + countComments(c.replies), 0);

export function postComment(threadId: string, input: CommentInput, author: Comment["author"], parentId: string | null = null) {
  const comment: Comment = {
    id: crypto.randomUUID(),
    threadId,
    parentId,
    author,
    body: input.body.trim(),
    spoiler: input.spoiler,
    likes: 0,
    createdAt: Date.now(),
  };
  store.write((s) => ({ ...s, posted: [...s.posted, comment] }));
}

export function toggleLike(commentId: string) {
  store.write((s) => ({ ...s, liked: s.liked.includes(commentId) ? s.liked.filter((id) => id !== commentId) : [...s.liked, commentId] }));
}

/** Marks a comment deleted; its replies stay attached (the thread shows a placeholder). */
export function deleteComment(commentId: string) {
  store.write((s) => ({ ...s, deleted: s.deleted.includes(commentId) ? s.deleted : [...s.deleted, commentId] }));
}

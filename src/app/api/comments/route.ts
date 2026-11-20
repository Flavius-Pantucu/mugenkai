import { CommentPostSchema, ThreadIdSchema, type ApiComment } from "@/data/schema";
import { getCurrentUser, requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { HttpError, json, rateLimit, readJson, route } from "@/server/http";

type Row = {
  id: string;
  threadId: string;
  parentId: string | null;
  userId: string;
  body: string;
  spoiler: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  user: { username: string; avatarUrl: string | null };
  _count: { likes: number };
  likes: { userId: string }[];
};

const include = (viewerId?: string) => ({
  user: { select: { username: true, avatarUrl: true } },
  _count: { select: { likes: true } },
  likes: { where: { userId: viewerId ?? "" }, select: { userId: true } },
});

/** Deleted comments keep their place in the tree but expose nothing about the author or text. */
function toApi(c: Row, viewerId?: string): ApiComment {
  const removed = c.deletedAt !== null;
  return {
    id: c.id,
    threadId: c.threadId,
    parentId: c.parentId,
    author: removed ? { name: "deleted", avatarUrl: null } : { name: c.user.username, avatarUrl: c.user.avatarUrl },
    body: removed ? "[deleted]" : c.body,
    spoiler: removed ? false : c.spoiler,
    likes: c._count.likes,
    createdAt: c.createdAt.getTime(),
    likedByMe: c.likes.length > 0,
    mine: !removed && c.userId === viewerId,
    removed,
  };
}

/** GET /api/comments?thread=anime:16498 — public; viewer flags filled in when signed in. */
export const GET = route(async (req: Request) => {
  const thread = ThreadIdSchema.safeParse(new URL(req.url).searchParams.get("thread"));
  if (!thread.success) throw new HttpError(400, "invalid_thread");
  const viewer = await getCurrentUser();
  const rows = await db().comment.findMany({
    where: { threadId: thread.data },
    orderBy: { createdAt: "asc" },
    take: 1000,
    include: include(viewer?.id),
  });
  return json({ comments: rows.map((r) => toApi(r, viewer?.id)) });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  rateLimit(`comment:${user.id}`, 10, 60_000);
  const input = await readJson(req, CommentPostSchema);

  if (input.parentId) {
    const parent = await db().comment.findUnique({ where: { id: input.parentId }, select: { threadId: true } });
    if (!parent || parent.threadId !== input.threadId) throw new HttpError(400, "invalid_parent");
  }

  const row = await db().comment.create({
    data: { threadId: input.threadId, parentId: input.parentId, userId: user.id, body: input.body.trim(), spoiler: input.spoiler },
    include: include(user.id),
  });
  return json({ comment: toApi(row, user.id) }, { status: 201 });
});

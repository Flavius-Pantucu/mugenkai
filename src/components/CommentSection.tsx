"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, EyeOff, Heart, MessageSquare, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { CommentInputSchema, type CommentInput } from "@/data/schema";
import { countComments, useThread, type CommentSort, type ThreadComment } from "@/lib/comments";
import { cn } from "@/lib/utils";

type ThreadActions = Pick<ReturnType<typeof useThread>, "post" | "like" | "remove">;
const Actions = createContext<ThreadActions | null>(null);
const useActions = () => useContext(Actions)!;

/** Runs a thread action; a failed request (network, rate limit) shows a toast instead of failing silently. */
const attempt = (fn: () => Promise<void>) => fn().catch((err: Error) => toast.error(err.message || "Something went wrong"));

const MAX_INDENT = 4; // deeper replies stop indenting so long chains stay readable on phones

type Author = { name: string; avatarUrl: string | null };

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

function timeAgo(ts: number) {
  const diff = ts - Date.now();
  for (const [unit, ms] of STEPS) if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  return "just now";
}

/** Threaded comments for a series ("anime:<id>"), an episode ("episode:<id>") or a chapter ("chapter:<id>"). */
export function CommentSection({ threadId, title = "Comments", className }: { threadId: string; title?: string; className?: string }) {
  const { user, backend } = useAuth();
  const [sort, setSort] = useState<CommentSort>("newest");
  const me = useMemo<Author | null>(() => (user ? { name: user.username, avatarUrl: user.avatarUrl } : null), [user]);
  const { comments, total, loading, error, post, like, remove } = useThread(threadId, { backend, me, sort });
  const actions = useMemo(() => ({ post, like, remove }), [post, like, remove]);

  return (
    <Actions.Provider value={actions}>
    <section aria-labelledby={`${threadId}-title`} className={cn("space-y-6", className)}>
      <div className="flex items-end justify-between gap-4">
        <h2
          id={`${threadId}-title`}
          className="flex items-baseline gap-2 text-white"
          style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.15rem, 1.8vw, 1.4rem)", fontWeight: 700 }}
        >
          {title}
          <span className="text-[13px] font-normal tabular-nums text-muted-foreground">{total}</span>
        </h2>
        {comments.length > 1 && (
          <Select value={sort} onValueChange={(v) => setSort(v === "top" ? "top" : "newest")}>
            <SelectTrigger aria-label="Sort comments" size="sm" className="w-[120px] bg-ink-raised">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="top">Top</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {me ? (
        <Composer threadId={threadId} author={me} />
      ) : (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Comments couldn&apos;t be loaded: {error}</p>
      ) : comments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" /> No comments yet. Start the conversation.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} me={me} depth={0} />
          ))}
        </ul>
      )}
    </section>
    </Actions.Provider>
  );
}

function Composer({
  threadId,
  author,
  parentId = null,
  replyTo,
  onDone,
}: {
  threadId: string;
  author: Author;
  parentId?: string | null;
  replyTo?: string;
  onDone?: () => void;
}) {
  const { post } = useActions();
  const form = useForm<CommentInput>({ resolver: zodResolver(CommentInputSchema), defaultValues: { body: "", spoiler: false } });
  const body = form.watch("body");
  const isReply = parentId !== null;

  // Keep the text if posting fails, so nothing typed is lost.
  const onSubmit = (values: CommentInput) =>
    attempt(async () => {
      await post(values, parentId);
      form.reset();
      onDone?.();
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3" noValidate>
        <Avatar className={cn("mt-1", isReply ? "size-7" : "size-9")}>
          {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{isReply ? `Reply to ${replyTo}` : "Your comment"}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    autoFocus={isReply}
                    placeholder={isReply ? `Reply to ${replyTo}…` : "Add a comment…"}
                    className={cn("resize-y bg-ink-raised", isReply ? "min-h-[56px]" : "min-h-[72px]")}
                    onKeyDown={(e) => e.key === "Escape" && onDone?.()}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between gap-3">
            <FormField
              control={form.control}
              name="spoiler"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <FormLabel className="text-sm font-normal text-muted-foreground">Contains spoilers</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              {onDone && (
                <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                  Cancel
                </Button>
              )}
              <Button type="submit" size="sm" disabled={!body.trim()}>
                {isReply ? "Post reply" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

function CommentItem({ comment: c, me, depth }: { comment: ThreadComment; me: Author | null; depth: number }) {
  const { like, remove } = useActions();
  const [revealed, setRevealed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const hidden = c.spoiler && !revealed && !c.removed;
  const replyCount = countComments(c.replies);

  return (
    <li>
      <div className="flex gap-3">
        <Avatar className={depth ? "size-7" : "size-9"}>
          {!c.removed && c.author.avatarUrl && <AvatarImage src={c.author.avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback>{c.removed ? "–" : c.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {c.removed ? (
            <p className="py-1 text-sm italic text-muted-foreground">Comment deleted</p>
          ) : (
            <>
              <p className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold text-white">{c.author.name}</span>
                <time dateTime={new Date(c.createdAt).toISOString()} suppressHydrationWarning className="text-xs text-muted-foreground">
                  {timeAgo(c.createdAt)}
                </time>
                {c.spoiler && (
                  <Badge variant="outline" className="border-coral-400/40 text-coral-300">
                    Spoiler
                  </Badge>
                )}
              </p>

              <div className="relative mt-1">
                <p className={cn("whitespace-pre-line break-words text-[14px] leading-relaxed text-zinc-300", hidden && "select-none blur-sm")} aria-hidden={hidden}>
                  {c.body}
                </p>
                {hidden && (
                  <Button variant="secondary" size="sm" onClick={() => setRevealed(true)} className="absolute left-0 top-1/2 h-7 -translate-y-1/2">
                    <EyeOff />
                    Show spoiler
                  </Button>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!me}
                  onClick={() => attempt(() => like(c.id))}
                  aria-pressed={c.likedByMe}
                  aria-label={c.likedByMe ? "Unlike" : "Like"}
                  className={cn("h-7 gap-1.5 px-2 text-muted-foreground", c.likedByMe && "text-coral-300")}
                >
                  <Heart className={cn("size-3.5", c.likedByMe && "fill-current")} />
                  <span className="tabular-nums">{c.likes}</span>
                </Button>
                {me && (
                  <Button variant="ghost" size="sm" onClick={() => setReplying((v) => !v)} aria-expanded={replying} className="h-7 px-2 text-muted-foreground">
                    <Reply className="size-3.5" />
                    Reply
                  </Button>
                )}
                {c.mine && (
                  <Button variant="ghost" size="sm" onClick={() => attempt(() => remove(c.id))} className="h-7 px-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}

          {replying && me && (
            <div className="mt-3">
              <Composer
                threadId={c.threadId}
                author={me}
                parentId={c.id}
                replyTo={c.author.name}
                onDone={() => {
                  setReplying(false);
                  setShowReplies(true);
                }}
              />
            </div>
          )}

          {c.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies((v) => !v)}
              aria-expanded={showReplies}
              className="mt-1 h-7 px-2 font-semibold text-primary hover:text-primary"
            >
              {showReplies ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              {showReplies ? "Hide" : "Show"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </Button>
          )}
        </div>
      </div>

      {showReplies && c.replies.length > 0 && (
        <ul className={cn("mt-4 space-y-4", depth < MAX_INDENT && "ml-4 border-l border-white/10 pl-4 sm:ml-[18px] sm:pl-5")}>
          {c.replies.map((r) => (
            <CommentItem key={r.id} comment={r} me={me} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

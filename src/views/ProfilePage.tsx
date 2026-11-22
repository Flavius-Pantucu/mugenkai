"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Camera, Clock, Heart, LogOut, Settings, Shield, Star, Tv, User } from "lucide-react";
import { toast } from "sonner";
import { AvatarPicker } from "@/components/AvatarPicker";
import { AnimeCard, MangaCard } from "@/components/ContentCard";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { LIST_STATUSES, ProfileSettingsSchema, type ListStatus, type AnimeSummary, type MangaSummary, type ProfileSettingsInput, type UserProfile } from "@/data/schema";
import { episodeLabel, parseChapterId, parseEpisodeId } from "@/data/series";
import { importFromAniList, listLabel, useList } from "@/lib/list";
import { isRemote } from "@/lib/api";
import { cn } from "@/lib/utils";
import { continueWatching, useProgress, WATCHED_AT } from "@/lib/progress";

export function ProfilePage({ anime, manga }: { anime: AnimeSummary[]; manga: MangaSummary[] }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const progress = useProgress();
  const list = useList();
  const [listFilter, setListFilter] = useState<ListStatus | "ALL">("ALL");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const watching = continueWatching(progress, anime);

  // Stats from what was actually watched/read (saved progress), not placeholders.
  const animeById = new Map(anime.map((a) => [a.id, a]));
  const watchedEpisodes = Object.entries(progress.episodes);
  const animeStarted = new Set(watchedEpisodes.map(([id]) => parseEpisodeId(id)?.animeId)).size;
  const mangaStarted = new Set(Object.keys(progress.chapters).map((id) => parseChapterId(id)?.mangaId)).size;
  const minutes = watchedEpisodes.reduce((sum, [id, e]) => {
    const duration = animeById.get(parseEpisodeId(id)?.animeId ?? "")?.episodeDuration ?? 24;
    return sum + (Math.min(e.progress, WATCHED_AT) / WATCHED_AT) * duration;
  }, 0);
  type ListItem = ({ kind: "anime"; item: AnimeSummary } | { kind: "manga"; item: MangaSummary }) & { status: ListStatus; score: number | null };
  const listItems = list.flatMap(({ seriesId: id, status, score }): ListItem[] => {
    const a = animeById.get(id);
    if (a) return [{ kind: "anime", item: a, status, score }];
    const m = manga.find((x) => x.id === id);
    return m ? [{ kind: "manga", item: m, status, score }] : [];
  });
  const shownItems = listFilter === "ALL" ? listItems : listItems.filter((i) => i.status === listFilter);
  const countOf = (f: ListStatus | "ALL") => (f === "ALL" ? listItems.length : listItems.filter((i) => i.status === f).length);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink pt-16">
        <p className="text-muted-foreground">Sign in to view your profile.</p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const stats = [
    { label: "Anime started", value: animeStarted, icon: Tv },
    { label: "Manga started", value: mangaStarted, icon: BookOpen },
    { label: "Hours watched", value: Math.round(minutes / 60), icon: Clock },
    { label: "In my list", value: listItems.length, icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="relative">
        <div className="h-48 overflow-hidden sm:h-64">
          {anime[2] && <img src={anime[2].bannerImage} alt="" className="h-full w-full object-cover opacity-30" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        </div>

        <div className="relative mx-auto -mt-20 w-[90%]">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative">
              <button type="button" onClick={() => setAvatarOpen(true)} className="group relative block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Change avatar">
                <Avatar className="size-28 rounded-2xl border-4 border-ink shadow-2xl sm:size-32">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} className="object-cover object-top" />}
                  <AvatarFallback className="rounded-2xl text-2xl">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="absolute inset-1 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="size-6 text-white" />
                </span>
              </button>
              <AvatarPicker user={user} series={[...anime, ...manga]} open={avatarOpen} onOpenChange={setAvatarOpen} />
              {user.role === "ADMIN" && (
                <Badge className="absolute -right-2 -top-2 rounded-lg p-1.5" aria-label="Admin">
                  <Shield className="size-3.5" />
                </Badge>
              )}
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
                {user.username}
              </h1>
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            </div>

            <div className="flex items-center gap-2 pb-2">
              {user.role === "ADMIN" && (
                <Button asChild variant="outline">
                  <Link href="/admin">
                    <Shield />
                    Admin panel
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="border-coral-400/30 text-coral-300 hover:bg-coral-500/10 hover:text-coral-300"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                <LogOut />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-[90%]">
        <Tabs defaultValue="overview" className="gap-8">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-white/5 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto">
            {[
              { value: "overview", label: "Overview", icon: User },
              { value: "list", label: "My list", icon: Heart },
              { value: "settings", label: "Settings", icon: Settings },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex-none rounded-none border-0 border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
              >
                <t.icon />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.label} className="gap-2 bg-white/[0.02] py-5">
                  <CardContent className="px-5">
                    <s.icon className="mb-3 size-5 text-primary" />
                    <p className="text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
                      {s.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
                <Clock className="size-[18px] text-primary" /> Continue watching
              </h2>
              {watching.length === 0 && (
                <EmptyState
                  title="Nothing in progress yet"
                  body="Start an episode and it shows up here, ready to resume."
                  actions={[{ href: "/anime", label: "Find something to watch" }]}
                />
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {watching.map((h) => (
                  <Link key={h.anime.id} href={`/watch/${h.anime.id}/${h.episodeId}`} className="group">
                    <Card className="flex-row gap-3 bg-white/[0.02] p-3 transition-colors group-hover:bg-white/[0.04]">
                      <img src={h.anime.coverImage} alt="" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="truncate text-sm font-semibold text-white">{h.anime.title}</p>
                          <p className="text-xs text-muted-foreground">{episodeLabel(h.anime, h)}</p>
                        </div>
                        <div>
                          <Progress value={h.progress} className="h-1.5" />
                          <p className="mt-1 text-[11px] text-muted-foreground">{Math.round(h.progress)}% watched</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <AniListImport />
            {listItems.length === 0 ? (
              <EmptyState
                title="Your list is empty"
                body="Save titles to keep track of what you're watching, reading or planning next."
                actions={[
                  { href: "/anime", label: "Browse anime" },
                  { href: "/manga", label: "Browse manga" },
                ]}
              />
            ) : (
              <>
                <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
                  {(["ALL", ...LIST_STATUSES] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant="outline"
                      aria-pressed={listFilter === f}
                      onClick={() => setListFilter(f)}
                      className={cn("rounded-full", listFilter === f && "border-primary bg-primary/15 text-white")}
                    >
                      {f === "ALL" ? "All" : f === "CURRENT" ? "Watching / reading" : listLabel(f, "anime")}
                      <span className="tabular-nums text-muted-foreground">{countOf(f)}</span>
                    </Button>
                  ))}
                </div>
                {shownItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing here yet. Change a title&apos;s status from its page.</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {shownItems.map((s) => (
                      <li key={s.item.id} className="space-y-1.5">
                        {s.kind === "anime" ? <AnimeCard anime={s.item} fluid /> : <MangaCard manga={s.item} fluid />}
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="rounded">{listLabel(s.status, s.kind)}</Badge>
                          {s.score && (
                            <span className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold tabular-nums text-white">
                              <Star className="size-3 fill-coral-400 text-coral-400" />
                              {s.score}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <SettingsForm user={user} />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

function EmptyState({ title, body, actions }: { title: string; body: string; actions: { href: string; label: string }[] }) {
  return (
    <Card className="items-center gap-3 border-dashed bg-transparent px-6 py-10 text-center">
      <p className="font-semibold text-white">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {actions.map((a, i) => (
          <Button key={a.href} asChild variant={i === 0 ? "default" : "outline"}>
            <Link href={a.href}>{a.label}</Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}

/** Pulls a public AniList list (MyAnimeList users can import into AniList first). Needs an account. */
function AniListImport() {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  if (!isRemote()) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setBusy(true);
    try {
      const { imported, skipped } = await importFromAniList(username.trim());
      toast.success(`Imported ${imported} ${imported === 1 ? "title" : "titles"}${skipped ? ` · ${skipped} not in our catalog` : ""}`);
      setUsername("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-ink-raised p-4">
      <label className="min-w-[200px] flex-1 text-[13px] text-muted-foreground">
        Import from AniList
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="AniList username" autoComplete="off" className="mt-1.5" />
      </label>
      <Button type="submit" disabled={busy || !username.trim()}>
        {busy ? "Importing…" : "Import"}
      </Button>
      <p className="w-full text-[12px] text-muted-foreground">
        Overwrites matching titles. On MyAnimeList? Import your MAL list into AniList first, then import here.
      </p>
    </form>
  );
}

function SettingsForm({ user }: { user: UserProfile }) {
  const { updateProfile } = useAuth();
  const form = useForm<ProfileSettingsInput>({
    resolver: zodResolver(ProfileSettingsSchema),
    defaultValues: { username: user.username, email: user.email, bio: user.bio, matureContent: user.matureContent, notifications: user.notifications },
  });
  const save = (values: ProfileSettingsInput) =>
    updateProfile(values)
      .then(() => toast.success("Settings saved"))
      .catch((err: Error) => form.setError("root", { message: err.message }));

  const toggles = [
    { name: "matureContent", label: "Mature content", description: "Show mature-rated titles" },
    { name: "notifications", label: "Notifications", description: "Alerts for new episodes and chapters" },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save)} className="max-w-2xl space-y-6" noValidate>
        {form.formState.errors.root && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea rows={3} className="resize-none" {...field} />
              </FormControl>
              <FormDescription>{field.value.length}/280</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {toggles.map((t) => (
          <FormField
            key={t.name}
            control={form.control}
            name={t.name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-white">{t.label}</FormLabel>
                  <FormDescription>{t.description}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        ))}

        <Button type="submit" size="lg">
          Save changes
        </Button>
      </form>
    </Form>
  );
}

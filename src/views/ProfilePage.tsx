"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Clock, Heart, LogOut, Settings, Shield, Tv, User } from "lucide-react";
import { toast } from "sonner";
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
import { animeList, episodeLabel, popularAnime } from "@/data/mock-data";
import { continueWatching, useProgress } from "@/lib/progress";
import { ProfileSettingsSchema, type ProfileSettingsInput, type UserProfile } from "@/data/schema";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const watching = continueWatching(useProgress());

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
    { label: "Anime watched", value: 47, icon: Tv },
    { label: "Manga read", value: 23, icon: BookOpen },
    { label: "Hours spent", value: 312, icon: Clock },
    { label: "Favorites", value: user.favorites.length, icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="relative">
        <div className="h-48 overflow-hidden sm:h-64">
          <img src={animeList[2].bannerImage} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        </div>

        <div className="relative mx-auto -mt-20 w-[90%]">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative">
              <Avatar className="size-28 rounded-2xl border-4 border-ink shadow-2xl sm:size-32">
                <AvatarImage src={user.avatarUrl} alt={user.username} className="object-cover" />
                <AvatarFallback className="rounded-2xl text-2xl">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
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
              <div className="mt-2 flex flex-wrap gap-2">
                {user.preferredGenres.map((g) => (
                  <Badge key={g} variant="outline" className="border-primary/20 bg-primary/10 text-lagoon-200">
                    {g}
                  </Badge>
                ))}
              </div>
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
                onClick={() => {
                  logout();
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
              { value: "watchlist", label: "Watch list", icon: Clock },
              { value: "favorites", label: "Favorites", icon: Heart },
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
                <p className="text-sm text-muted-foreground">
                  Nothing in progress yet. Start an episode and it shows up here.
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {watching.map((h) => (
                  <Link key={h.anime.id} href={`/watch/${h.anime.id}/${h.episode.id}`} className="group">
                    <Card className="flex-row gap-3 bg-white/[0.02] p-3 transition-colors group-hover:bg-white/[0.04]">
                      <img src={h.anime.coverImage} alt="" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="truncate text-sm font-semibold text-white">{h.anime.title}</p>
                          <p className="text-xs text-muted-foreground">{episodeLabel(h.anime, h.episode)}</p>
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

          <TabsContent value="watchlist">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {popularAnime.slice(0, 12).map((a) => (
                <li key={a.id}>
                  <AnimeCard anime={a} fluid />
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="favorites">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {user.favorites.map((item) => (
                <li key={item.id}>{"episodes" in item ? <AnimeCard anime={item} fluid /> : <MangaCard manga={item} fluid />}</li>
              ))}
            </ul>
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

function SettingsForm({ user }: { user: UserProfile }) {
  const form = useForm<ProfileSettingsInput>({
    resolver: zodResolver(ProfileSettingsSchema),
    defaultValues: { username: user.username, email: user.email, bio: user.bio, matureContent: false, notifications: true },
  });

  const toggles = [
    { name: "matureContent", label: "Mature content", description: "Show mature-rated titles" },
    { name: "notifications", label: "Notifications", description: "Alerts for new episodes and chapters" },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => toast.success("Settings saved"))} className="max-w-2xl space-y-6" noValidate>
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

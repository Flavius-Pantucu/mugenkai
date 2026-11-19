"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, ArrowUp, BookOpen, Eye, LayoutDashboard, MoreHorizontal, Pencil, Plus, Search, Trash2, TrendingUp, Tv, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { animeList, mangaList } from "@/data/mock-data";
import { SeriesFormSchema, type SeriesFormInput } from "@/data/schema";

const sections = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "anime", label: "Anime", icon: Tv },
  { value: "manga", label: "Manga", icon: BookOpen },
  { value: "users", label: "Users", icon: Users },
] as const;

const users = [
  { name: "ShadowBlade99", email: "shadow@mugenkai.dev", role: "ADMIN", joined: "Jan 2025" },
  { name: "AkiraFan42", email: "akira@example.com", role: "USER", joined: "Mar 2025" },
  { name: "MangaLover99", email: "manga@example.com", role: "USER", joined: "Feb 2026" },
  { name: "NeonKnight", email: "neon@example.com", role: "USER", joined: "Dec 2025" },
  { name: "SakuraWind", email: "sakura@example.com", role: "USER", joined: "Nov 2025" },
];

export function AdminPage() {
  const stats = [
    { label: "Total users", value: "12,847", change: "+12%", icon: Users },
    { label: "Anime", value: String(animeList.length), change: "+3", icon: Tv },
    { label: "Manga", value: String(mangaList.length), change: "+2", icon: BookOpen },
    { label: "Daily streams", value: "34,291", change: "+8%", icon: TrendingUp },
  ];

  const activity = [
    { action: "New user registered", detail: "AkiraFan42", time: "2 min ago" },
    { action: "Episode uploaded", detail: `${animeList[0].title} E${animeList[0].episodes.length}`, time: "15 min ago" },
    { action: "Chapter published", detail: `${mangaList[3].title} Ch. ${mangaList[3].chapters.length}`, time: "1 hour ago" },
    { action: "Content reported", detail: `${animeList[7].title} E12`, time: "2 hours ago" },
    { action: "New user registered", detail: "MangaLover99", time: "3 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-ink pt-16">
      <Tabs defaultValue="dashboard" orientation="vertical" className="flex-col gap-0 md:flex-row">
        <aside className="border-b border-white/5 bg-sidebar p-4 md:min-h-[calc(100vh-4rem)] md:w-60 md:border-b-0 md:border-r">
          <h2 className="mb-4 hidden px-3 text-lg font-bold text-white md:block" style={{ fontFamily: "var(--font-family-heading)" }}>
            Admin panel
          </h2>
          <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0 md:flex-col md:items-stretch">
            {sections.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="flex-none justify-start gap-3 border-0 px-3 py-2.5 text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-lagoon-200 data-[state=active]:shadow-none dark:data-[state=active]:border-0 dark:data-[state=active]:bg-primary/15 md:w-full"
              >
                <s.icon />
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </aside>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <TabsContent value="dashboard" className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
              Dashboard
            </h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.label} className="gap-3 bg-white/[0.02]">
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <s.icon className="size-5 text-primary" />
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                        <ArrowUp />
                        {s.change}
                      </Badge>
                    </div>
                    <p className="text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
                      {s.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="gap-0 bg-white/[0.02] py-0">
              <CardHeader className="flex-row items-center gap-2 border-b border-white/5 py-4">
                <Activity className="size-[18px] text-primary" />
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {activity.map((a, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="bg-white/5" />}
                    <div className="flex items-center justify-between px-6 py-3 text-sm">
                      <p className="text-zinc-300">
                        {a.action} <span className="text-lagoon-300">{a.detail}</span>
                      </p>
                      <span className="ml-4 shrink-0 text-xs text-muted-foreground">{a.time}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anime">
            <SeriesTable kind="anime" />
          </TabsContent>
          <TabsContent value="manga">
            <SeriesTable kind="manga" />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
              Users
            </h1>
            <Card className="bg-white/[0.02] py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.joined}</TableCell>
                      <TableCell className="text-right">
                        <RowActions label={u.name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function RowActions({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${label}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye />
          View
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => toast(`Deleting "${label}" is not wired up yet`)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SeriesTable({ kind }: { kind: "anime" | "manga" }) {
  const [query, setQuery] = useState("");
  const noun = kind === "anime" ? "Anime" : "Manga";
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = kind === "anime"
      ? animeList.map((a) => ({ ...a, units: a.episodes.length }))
      : mangaList.map((m) => ({ ...m, units: m.chapters.length }));
    return q ? list.filter((r) => r.title.toLowerCase().includes(q)) : list;
  }, [kind, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-family-heading)" }}>
          Manage {kind}
        </h1>
        <AddSeriesDialog noun={noun} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${kind}…`} className="h-10 pl-9" aria-label={`Search ${kind}`} />
      </div>

      <Card className="bg-white/[0.02] py-0">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>{kind === "anime" ? "Episodes" : "Chapters"}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={item.coverImage} alt="" loading="lazy" className="h-14 w-10 rounded object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.genres.slice(0, 2).join(", ")}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === "ONGOING" ? "default" : "secondary"}>{item.status === "ONGOING" ? "Ongoing" : "Completed"}</Badge>
                </TableCell>
                <TableCell className="text-yellow-400 tabular-nums">{item.rating.toFixed(1)}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{item.units}</TableCell>
                <TableCell className="text-right">
                  <RowActions label={item.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddSeriesDialog({ noun }: { noun: string }) {
  const [open, setOpen] = useState(false);
  const form = useForm<SeriesFormInput>({
    resolver: zodResolver(SeriesFormSchema),
    defaultValues: { title: "", description: "", status: "ONGOING", rating: 0, coverImage: "" },
  });

  const onSubmit = (values: SeriesFormInput) => {
    toast.success(`${noun} "${values.title}" created`);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add {noun.toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {noun.toLowerCase()}</DialogTitle>
          <DialogDescription>Fields are validated before anything is saved.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} className="resize-none" placeholder="Synopsis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover image URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

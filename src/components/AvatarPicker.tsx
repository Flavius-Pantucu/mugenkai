"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/data/schema";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Series = { id: string; title: string; coverImage: string };
type Character = { name: string; image: string };

/** Two steps: pick a series from the catalog, then one of its characters' AniList portraits. */
export function AvatarPicker({ user, series, open, onOpenChange }: { user: UserProfile; series: Series[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { updateProfile } = useAuth();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Series | null>(null);
  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? series.filter((s) => s.title.toLowerCase().includes(q)) : series).slice(0, 24);
  }, [series, query]);

  const openSeries = async (s: Series) => {
    setPicked(s);
    setCharacters(null);
    try {
      const { characters } = await api<{ characters: Character[] }>(`/api/characters?series=${encodeURIComponent(s.id)}`);
      setCharacters(characters.filter((c) => !c.image.endsWith("/default.jpg")));
    } catch {
      setCharacters([]);
    }
  };

  const choose = async (avatarUrl: string | null) => {
    setSaving(avatarUrl ?? "remove");
    try {
      const { username, email, bio, matureContent, notifications } = user;
      await updateProfile({ username, email, bio, matureContent, notifications, avatarUrl });
      toast.success(avatarUrl ? "Avatar updated" : "Avatar removed");
      onOpenChange(false);
      setPicked(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save avatar");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{picked ? picked.title : "Choose an avatar"}</DialogTitle>
          <DialogDescription>{picked ? "Pick a character" : "Pick a series, then one of its characters"}</DialogDescription>
        </DialogHeader>

        {picked ? (
          <>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setPicked(null)}>
              <ArrowLeft />
              All series
            </Button>
            <ScrollArea className="h-[55vh] pr-3">
              {characters === null ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="animate-spin text-muted-foreground" aria-label="Loading characters" />
                </div>
              ) : characters.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No character portraits for this series.</p>
              ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {characters.map((c) => (
                    <li key={c.image}>
                      <button
                        type="button"
                        disabled={saving !== null}
                        onClick={() => choose(c.image)}
                        aria-label={`Use ${c.name} as avatar`}
                        className={cn(
                          "group relative block w-full overflow-hidden rounded-xl border-2 border-transparent text-left transition hover:border-primary focus-visible:border-primary focus-visible:outline-none disabled:opacity-60",
                          user.avatarUrl === c.image && "border-primary",
                        )}
                      >
                        <img src={c.image} alt="" className="aspect-square w-full object-cover object-top" loading="lazy" />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-4 text-xs font-medium text-white">
                          {c.name}
                        </span>
                        {saving === c.image && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="animate-spin text-white" />
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search anime or manga" className="pl-9" aria-label="Search series" />
            </div>
            <ScrollArea className="h-[55vh] pr-3">
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openSeries(s)}
                      className="block w-full overflow-hidden rounded-xl border-2 border-transparent text-left transition hover:border-primary focus-visible:border-primary focus-visible:outline-none"
                    >
                      <img src={s.coverImage} alt="" className="aspect-[2/3] w-full object-cover" loading="lazy" />
                      <span className="line-clamp-2 px-1 py-1.5 text-xs font-medium">{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {matches.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No series match “{query}”.</p>}
            </ScrollArea>
          </>
        )}

        {user.avatarUrl && !picked && (
          <Button variant="ghost" size="sm" className="w-fit text-muted-foreground" disabled={saving !== null} onClick={() => choose(null)}>
            Remove avatar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

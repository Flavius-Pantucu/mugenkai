"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Megaphone, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { updateSiteConfig, type SiteConfigInput } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/server/site-config";

export function SiteCmsTab({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState<SiteConfigInput>({ ...initial });
  const [pinnedText, setPinnedText] = useState(initial.pinnedHeroIds.join(", "));
  const [navJson, setNavJson] = useState(
    JSON.stringify(
      initial.navLinks ?? [
        { label: "Home", to: "/" },
        { label: "Anime", to: "/anime" },
        { label: "Manga", to: "/manga" },
        { label: "My List", to: "/my-list" },
      ],
      null,
      2,
    ),
  );
  const [footerJson, setFooterJson] = useState(
    JSON.stringify(
      initial.footerLinks ?? [
        {
          title: "Browse",
          links: [
            { label: "Home", href: "/" },
            { label: "Anime", href: "/anime" },
            { label: "Manga", href: "/manga" },
            { label: "My List", href: "/my-list" },
          ],
        },
        {
          title: "Platform",
          links: [
            { label: "About", href: "/about" },
            { label: "DMCA", href: "/dmca" },
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ],
        },
      ],
      null,
      2,
    ),
  );
  const [pending, start] = useTransition();

  const save = () => {
    let parsedNav = form.navLinks;
    let parsedFooter = form.footerLinks;
    try {
      parsedNav = JSON.parse(navJson);
    } catch {
      toast.error("Navigation links JSON is invalid");
      return;
    }
    try {
      parsedFooter = JSON.parse(footerJson);
    } catch {
      toast.error("Footer links JSON is invalid");
      return;
    }

    start(async () => {
      try {
        await updateSiteConfig({
          ...form,
          pinnedHeroIds: pinnedText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          navLinks: parsedNav,
          footerLinks: parsedFooter,
        });
        toast.success("Site configuration saved and live");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save site config");
      }
    });
  };

  return (
    <div className="space-y-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Site &amp; Content Management</h2>
          <p className="text-sm text-zinc-400">
            Control branding, hero curation, navigation, footer links, announcements, and platform feature flags.
          </p>
        </div>
        <Button onClick={save} disabled={pending} className="bg-lagoon-500 text-ink hover:bg-lagoon-400">
          <Save className="size-4" />
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {/* Branding & Copy */}
      <div className="grid gap-6 rounded-lg bg-ink-raised/60 p-5 ring-1 ring-white/[0.06] md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site name</Label>
          <Input id="siteName" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footerCopyright">Footer copyright line</Label>
          <Input
            id="footerCopyright"
            value={form.footerCopyright}
            onChange={(e) => setForm({ ...form, footerCopyright: e.target.value })}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tagline">Footer tagline</Label>
          <Textarea id="tagline" rows={2} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="space-y-4 rounded-lg bg-ink-raised/60 p-5 ring-1 ring-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-lagoon-300" />
            <h3 className="font-medium text-white">Site-wide Announcement Banner</h3>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ann-active" className="text-xs text-zinc-400">
              Active
            </Label>
            <Switch
              id="ann-active"
              checked={form.announcementActive}
              onCheckedChange={(v) => setForm({ ...form, announcementActive: v })}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px]">
          <div className="space-y-1.5">
            <Label htmlFor="ann-text">Message</Label>
            <Input
              id="ann-text"
              placeholder="e.g. Solo Leveling S2 episodes now streaming!"
              value={form.announcementText ?? ""}
              onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-link">Optional link</Label>
            <Input
              id="ann-link"
              placeholder="/anime/..."
              value={form.announcementLink ?? ""}
              onChange={(e) => setForm({ ...form, announcementLink: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-type">Tone</Label>
            <Select
              value={form.announcementType}
              onValueChange={(v) => setForm({ ...form, announcementType: v as SiteConfigInput["announcementType"] })}
            >
              <SelectTrigger id="ann-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Hero Banner Curation */}
      <div className="space-y-4 rounded-lg bg-ink-raised/60 p-5 ring-1 ring-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-lagoon-300" />
          <h3 className="font-medium text-white">Homepage Hero Banner</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="heroMode">Selection mode</Label>
            <Select value={form.heroMode} onValueChange={(v) => setForm({ ...form, heroMode: v as SiteConfigInput["heroMode"] })}>
              <SelectTrigger id="heroMode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Random Top 40)</SelectItem>
                <SelectItem value="pinned">Pinned only</SelectItem>
                <SelectItem value="mixed">Pinned + Auto fill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pinnedIds">Pinned Series IDs (comma-separated)</Label>
            <Input
              id="pinnedIds"
              placeholder="e.g. 16498, 21, 154587"
              value={pinnedText}
              onChange={(e) => setPinnedText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Feature Flags & Maintenance */}
      <div className="grid gap-6 rounded-lg bg-ink-raised/60 p-5 ring-1 ring-white/[0.06] md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-medium text-white">Platform Controls</h3>
          <ToggleRow
            id="reg-open"
            label="User registration open"
            desc="Allow new visitors to create accounts"
            checked={form.registrationOpen}
            onChange={(v) => setForm({ ...form, registrationOpen: v })}
          />
          <ToggleRow
            id="comments-on"
            label="Comments enabled"
            desc="Allow posting new comments across series & episodes"
            checked={form.commentsEnabled}
            onChange={(v) => setForm({ ...form, commentsEnabled: v })}
          />
          <ToggleRow
            id="downloads-on"
            label="Episode downloads enabled"
            desc="Allow /api/download requests"
            checked={form.downloadsEnabled}
            onChange={(v) => setForm({ ...form, downloadsEnabled: v })}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-300" />
              <h3 className="font-medium text-white">Maintenance Mode</h3>
            </div>
            <Switch checked={form.maintenanceMode} onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maint-msg">Maintenance notice</Label>
            <Textarea
              id="maint-msg"
              rows={3}
              value={form.maintenanceMessage}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Navigation & Footer Links */}
      <div className="grid gap-6 rounded-lg bg-ink-raised/60 p-5 ring-1 ring-white/[0.06] md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nav-json">Navbar Links (JSON)</Label>
          <Textarea id="nav-json" rows={8} className="font-mono text-xs" value={navJson} onChange={(e) => setNavJson(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footer-json">Footer Columns (JSON)</Label>
          <Textarea
            id="footer-json"
            rows={8}
            className="font-mono text-xs"
            value={footerJson}
            onChange={(e) => setFooterJson(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  desc,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm text-white">
          {label}
        </Label>
        <p className="text-xs text-zinc-400">{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

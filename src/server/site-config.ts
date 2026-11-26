import { unstable_cache } from "next/cache";
import { db } from "./db";
import { backendEnabled } from "./env";

export interface NavLinkItem {
  label: string;
  to: string;
}

export interface FooterColumnItem {
  title: string;
  links: { label: string; href: string }[];
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  footerCopyright: string;
  announcementText: string | null;
  announcementLink: string | null;
  announcementType: "info" | "warning" | "success";
  announcementActive: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  registrationOpen: boolean;
  commentsEnabled: boolean;
  downloadsEnabled: boolean;
  heroMode: "auto" | "pinned" | "mixed";
  pinnedHeroIds: string[];
  footerLinks: FooterColumnItem[] | null;
  navLinks: NavLinkItem[] | null;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Mugenkai",
  tagline: "Your gateway to limitless anime and manga. Stream, read, and discover stories that move you.",
  footerCopyright: "2026 Mugenkai. Titles and artwork belong to their owners.",
  announcementText: null,
  announcementLink: null,
  announcementType: "info",
  announcementActive: false,
  maintenanceMode: false,
  maintenanceMessage: "We are performing scheduled maintenance. Back shortly.",
  registrationOpen: true,
  commentsEnabled: true,
  downloadsEnabled: true,
  heroMode: "auto",
  pinnedHeroIds: [],
  footerLinks: null,
  navLinks: null,
};

const readDbConfig = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await db().siteConfig.findUnique({ where: { id: "default" } });
      if (!row) return DEFAULT_SITE_SETTINGS;
      return {
        siteName: row.siteName,
        tagline: row.tagline,
        footerCopyright: row.footerCopyright,
        announcementText: row.announcementText,
        announcementLink: row.announcementLink,
        announcementType: (row.announcementType === "warning" || row.announcementType === "success" ? row.announcementType : "info"),
        announcementActive: row.announcementActive,
        maintenanceMode: row.maintenanceMode,
        maintenanceMessage: row.maintenanceMessage,
        registrationOpen: row.registrationOpen,
        commentsEnabled: row.commentsEnabled,
        downloadsEnabled: row.downloadsEnabled,
        heroMode: (row.heroMode === "pinned" || row.heroMode === "mixed" ? row.heroMode : "auto"),
        pinnedHeroIds: row.pinnedHeroIds ?? [],
        footerLinks: Array.isArray(row.footerLinks) ? (row.footerLinks as unknown as FooterColumnItem[]) : null,
        navLinks: Array.isArray(row.navLinks) ? (row.navLinks as unknown as NavLinkItem[]) : null,
      };
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  },
  ["site-config"],
  { tags: ["site-config"], revalidate: 300 },
);

export async function getSiteConfig(): Promise<SiteSettings> {
  if (!backendEnabled) return DEFAULT_SITE_SETTINGS;
  return readDbConfig();
}

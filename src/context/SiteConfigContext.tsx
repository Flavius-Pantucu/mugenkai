"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/server/site-config";

const DEFAULT_SETTINGS: SiteSettings = {
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

const SiteConfigContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteConfigProvider({ value, children }: { value: SiteSettings; children: React.ReactNode }) {
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

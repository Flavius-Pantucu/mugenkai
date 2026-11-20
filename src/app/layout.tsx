import type { Metadata, Viewport } from "next";
import "@/styles/index.css";
import { AuthProvider } from "@/context/AuthContext";
import { MobileTabBar, Navbar } from "@/components/Navbar";
import { CustomCursor } from "@/components/CustomCursor";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { searchIndex } from "@/data/series";
import { getCatalog } from "@/server/catalog";

export const metadata: Metadata = { title: "Mugenkai", icons: "/favicon.svg" };
// cover: lets the phone tab bar pad itself above the home indicator (env(safe-area-inset-bottom)).
export const viewport: Viewport = { viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { anime, manga } = await getCatalog();
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-ink">
              <CustomCursor />
              <Navbar searchIndex={searchIndex(anime, manga)} />
              <main>{children}</main>
              <MobileTabBar />
            </div>
            <Toaster position="bottom-right" mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }} />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

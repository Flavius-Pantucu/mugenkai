"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete and reset progress bar on route transition completion
  useEffect(() => {
    if (!active) return;
    setProgress(100);
    cleanupTimerRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 250);

    return () => {
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Only handle standard left clicks without modifier keys
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
        return;
      }

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore in-page hash links, tel/mailto, downloads
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || anchor.hasAttribute("download")) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        // Only internal links within the same origin
        if (targetUrl.origin !== window.location.origin) return;

        // If navigating to the exact same URL, ignore
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
          return;
        }

        // Immediately trigger progress bar
        if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);

        setActive(true);
        setProgress(28);

        timerRef.current = setTimeout(() => {
          setProgress(65);
          timerRef.current = setTimeout(() => {
            setProgress(85);
          }, 400);
        }, 150);
      } catch {
        // Invalid URL, ignore
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[99999] h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(20,184,166,0.9)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: active || progress === 100 ? 1 : 0,
        }}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink pt-16">
      <div className="px-4 text-center">
        <h1
          className="mb-4 text-primary"
          style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(4rem, 10vw, 8rem)", fontWeight: 900, lineHeight: 1 }}
        >
          404
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">This page has vanished into another dimension.</p>
        <Button asChild size="lg">
          <Link href="/">
            <Home />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}

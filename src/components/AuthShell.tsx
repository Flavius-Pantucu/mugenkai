"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogoMark } from "./Logo";

/** Shared frame for sign-in and sign-up: blurred key art, logo, and a card. */
export function AuthShell({
  backdrop,
  title,
  description,
  children,
  footer,
}: {
  backdrop: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink py-24">
      <div className="absolute inset-0">
        <img src={backdrop} alt="" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-4 w-full max-w-md"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <LogoMark className="h-10 w-14" />
          <span className="tracking-wider text-white" style={{ fontFamily: "var(--font-family-heading)", fontSize: "22px", fontWeight: 700 }}>
            MUGENKAI
          </span>
        </Link>

        <Card className="border-white/10 bg-ink-raised/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-family-heading)" }}>
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/** Password field with a show/hide toggle. */
export function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

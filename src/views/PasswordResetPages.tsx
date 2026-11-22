"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, PasswordInput } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { ForgotPasswordSchema, ResetPasswordSchema, type ForgotPasswordInput, type ResetPasswordInput } from "@/data/schema";

const backToLogin = (
  <Link href="/login" className="font-medium text-primary hover:underline">
    Back to sign in
  </Link>
);

function RootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}

export function ForgotPasswordPage({ backdrop }: { backdrop: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(ForgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await api("/api/auth/forgot-password", { body: values });
      setSentTo(values.email);
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Something went wrong" });
    }
  };

  return (
    <AuthShell backdrop={backdrop} title="Forgot password" description="We'll email you a link to set a new one" footer={backToLogin}>
      {sentTo ? (
        <p role="status" className="text-center text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, a reset link is on its way. It expires in 1 hour.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <RootError message={form.formState.errors.root?.message} />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full font-semibold" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Send reset link
            </Button>
          </form>
        </Form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage({ backdrop, token }: { backdrop: string; token: string }) {
  const router = useRouter();
  const form = useForm<ResetPasswordInput>({ resolver: zodResolver(ResetPasswordSchema), defaultValues: { token, password: "", confirmPassword: "" } });

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      await api("/api/auth/reset-password", { body: values });
      toast.success("Password updated. Sign in with your new password.");
      router.push("/login");
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Something went wrong" });
    }
  };

  return (
    <AuthShell backdrop={backdrop} title="Set a new password" description="Choose a password you haven't used here before" footer={backToLogin}>
      {!token ? (
        <p role="alert" className="text-center text-sm text-muted-foreground">
          This link is missing its token.{" "}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new one
          </Link>
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <RootError message={form.formState.errors.root?.message} />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" placeholder="At least 8 characters, one uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" placeholder="Repeat it" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full font-semibold" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </form>
        </Form>
      )}
    </AuthShell>
  );
}

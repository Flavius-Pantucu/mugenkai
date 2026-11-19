"use client";

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
import { useAuth } from "@/context/AuthContext";
import { animeList } from "@/data/mock-data";
import { LoginSchema, type LoginInput } from "@/data/schema";

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const form = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: LoginInput) => {
    try {
      await login(values);
      toast.success("Welcome back");
      router.push("/");
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Invalid credentials" });
    }
  };

  return (
    <AuthShell
      backdrop={animeList[1].bannerImage}
      title="Welcome back"
      description="Sign in to continue where you left off"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {form.formState.errors.root && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => toast("Password reset is not wired up yet")}>
                    Forgot password?
                  </Button>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="Your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full font-semibold" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}

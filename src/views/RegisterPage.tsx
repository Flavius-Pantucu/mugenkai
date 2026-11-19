"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, PasswordInput } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { animeList } from "@/data/mock-data";
import { RegisterSchema, type RegisterInput } from "@/data/schema";

export function RegisterPage() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      await register(values);
      toast.success(`Welcome to Mugenkai, ${values.username}`);
      router.push("/");
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Registration failed" });
    }
  };

  return (
    <AuthShell
      backdrop={animeList[4].bannerImage}
      title="Create your account"
      description="One history for every episode and chapter"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" placeholder="Choose a username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="Create a password" {...field} />
                </FormControl>
                <FormDescription>At least 8 characters, one uppercase letter.</FormDescription>
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
                  <PasswordInput autoComplete="new-password" placeholder="Repeat your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                  </FormControl>
                  <FormLabel className="text-sm font-normal leading-snug text-muted-foreground">
                    I agree to the Terms of Service and Privacy Policy
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full font-semibold" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}

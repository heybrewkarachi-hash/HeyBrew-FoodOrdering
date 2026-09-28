"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/admin-api";
import { ApiError, fetchCsrf } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      // Login has no session yet — CSRF endpoint requires auth, so skip until after login
      const user = await login(values.email, values.password);
      await fetchCsrf(true);
      setUser(user);
      toast.success(`Welcome back, ${user.name}`);
      const next = search.get("next") || "/";
      router.replace(next.startsWith("/") ? next : "/");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login failed. Check credentials and API.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-espresso/10 bg-cream-soft/90 p-6 shadow-soft backdrop-blur"
    >
      <p className="mb-5 text-sm text-espresso/65">
        Sign in with your admin account. Sessions use a secure HttpOnly cookie against the API.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="username" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-espresso/45 transition hover:text-espresso"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>
      </div>

      <Button type="submit" className="mt-6 w-full" loading={submitting}>
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#FFFBF5_0%,_#F7F3EC_40%,_#E8DFD2_100%)] px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233C2415' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/brand/heybrew-logo.jpg"
            alt="HeyBrew"
            width={88}
            height={88}
            className="mx-auto rounded-xl object-cover shadow-soft"
            priority
          />
          <h1 className="mt-5 font-display text-4xl text-espresso">HeyBrew</h1>
          <p className="mt-1 text-sm uppercase tracking-[0.22em] text-caramel">Staff Admin</p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-cream-deep/50" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-4 text-center text-xs text-espresso/45">
          Seeded owner credentials come from server{" "}
          <code className="text-espresso/60">ADMIN_EMAIL</code> /{" "}
          <code className="text-espresso/60">ADMIN_PASSWORD</code> (DEVELOPMENT SEED).
        </p>
      </div>
    </div>
  );
}

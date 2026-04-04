"use client";

import { GooseLoginMascot } from "@/components/GooseMascot";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get("error");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/");
    });
  }, [router]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      const supabase = createClient();
      if (!supabase) { setError("Supabase not configured"); setLoading(false); return; }

      try {
        if (mode === "signup") {
          const { data, error: signErr } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (signErr) {
            setError(signErr.message);
            return;
          }
          if (data.session) {
            router.refresh();
            router.replace("/");
            return;
          }
          setMessage(
            "Check your email for a confirmation link to finish signing up.",
          );
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInErr) {
            setError(signInErr.message);
            return;
          }
          router.refresh();
          router.replace("/");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, mode, router],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center sm:max-w-lg">
      <div className="mb-6">
        <GooseLoginMascot />
      </div>
      <div className="w-full rounded-2xl border-2 border-edge bg-card p-6 shadow-[0_4px_0_var(--edge)] dark:border-edge dark:bg-card/50 dark:shadow-[0_4px_0_rgba(0,0,0,0.35)] dark:backdrop-blur-xl sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-primary">
          {mode === "signin"
            ? "Welcome back — use your Supabase account."
            : "Sign up with email and password."}
        </p>

        {(error || urlError) && (
          <p
            className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800 dark:border-red-900/80 dark:bg-red-950/45 dark:text-red-300"
            role="alert"
          >
            {error ?? decodeURIComponent(urlError ?? "")}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-xl border-2 border-primary/35 bg-primary-light px-3 py-2 text-sm font-bold text-foreground">
            {message}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-extrabold uppercase tracking-wide text-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-extrabold uppercase tracking-wide text-muted"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border-2 border-primary-dark bg-primary py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:shadow-none"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className="font-extrabold text-primary-dark hover:underline"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMessage(null);
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-extrabold text-primary-dark hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMessage(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-muted underline-offset-2 transition hover:text-primary-dark hover:underline"
          >
            ← Back to Discover
          </Link>
        </p>
      </div>
    </div>
  );
}

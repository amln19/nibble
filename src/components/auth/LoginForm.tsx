"use client";

import { BrandMascot } from "@/components/BrandMascot";
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
        <BrandMascot variant="welcome" priority />
      </div>
      <div className="w-full rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-2xl font-semibold text-zinc-900">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "signin"
            ? "Welcome back — use your Supabase account."
            : "Sign up with email and password."}
        </p>

        {(error || urlError) && (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error ?? decodeURIComponent(urlError ?? "")}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm text-zinc-900">
            {message}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
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
              className="mt-1.5 w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
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
              className="mt-1.5 w-full rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/25"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className="font-medium text-green-600 hover:text-green-700"
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
                className="font-medium text-green-600 hover:text-green-700"
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
            className="text-sm text-zinc-500 underline-offset-2 hover:text-green-600 hover:underline"
          >
            ← Back to Discover
          </Link>
        </p>
      </div>
    </div>
  );
}

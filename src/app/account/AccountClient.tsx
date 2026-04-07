"use client";

import { createClient } from "@/lib/supabase/client";
import { outlinedAuthButtonClass } from "@/lib/auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  BookmarkCheck,
  Calendar,
  Clock,
  Compass,
  KeyRound,
  LogOut,
  Mail,
  Trophy,
  Users,
  UserRound,
} from "lucide-react";

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function canUseEmailPassword(user: User): boolean {
  if (!user.identities || user.identities.length === 0) return true;
  return user.identities.some((i) => i.provider === "email");
}

export function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(() =>
    createClient() ? undefined : null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (active) setUser(u);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
  }, [router]);

  const submitPasswordChange = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setPwError(null);
      setPwSuccess(null);

      if (newPassword.length < 6) {
        setPwError("Password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwError("New password and confirmation do not match.");
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setPwError("Account services are not configured.");
        return;
      }

      setPwLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          setPwError(error.message);
          return;
        }
        setNewPassword("");
        setConfirmPassword("");
        setPwSuccess("Password updated. You are still signed in on this device.");
        router.refresh();
      } finally {
        setPwLoading(false);
      }
    },
    [confirmPassword, newPassword, router],
  );

  const initial = useMemo(() => {
    const e = user?.email?.trim();
    if (!e) return "?";
    return e.charAt(0).toUpperCase();
  }, [user?.email]);

  if (user === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border-2 border-edge bg-card p-8 shadow-[0_4px_0_var(--edge)]">
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-surface" />
          <div className="mx-auto mt-6 h-6 w-48 animate-pulse rounded-xl bg-surface" />
          <div className="mx-auto mt-3 h-4 w-full max-w-xs animate-pulse rounded-lg bg-surface" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Discover
        </Link>
        <div className="rounded-3xl border-2 border-edge bg-card p-8 text-center shadow-[0_4px_0_var(--edge)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-edge bg-primary-light">
            <UserRound className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <h1 className="mt-6 font-black tracking-tight text-2xl text-foreground">
            Your account
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Sign in to save recipes, earn points, and sync your Nibble profile
            across devices.
          </p>
          <Link
            href="/login"
            className={`mt-8 inline-flex w-full items-center justify-center sm:w-auto ${outlinedAuthButtonClass} px-8 py-2.5`}
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const email = user.email ?? "—";
  const showPasswordForm = canUseEmailPassword(user);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Discover
      </Link>

      <div className="overflow-hidden rounded-3xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
        <div className="rounded-t-3xl border-b-2 border-edge bg-primary-light px-6 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/40 bg-card text-3xl font-black text-primary shadow-[0_3px_0_var(--primary-dark)]"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
                Signed in
              </p>
              <h1 className="mt-1 wrap-break-word font-black text-xl text-foreground sm:text-2xl">
                {email}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-0 px-6 sm:px-8">
          <div className="flex gap-3 border-b border-edge py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-edge bg-surface">
              <Mail className="h-4 w-4 text-muted" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
                Email
              </p>
              <p className="mt-0.5 wrap-break-word text-sm font-bold text-foreground">
                {email}
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-b border-edge py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-edge bg-surface">
              <Calendar className="h-4 w-4 text-muted" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
                Member since
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-b border-edge py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-edge bg-surface">
              <Clock className="h-4 w-4 text-muted" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
                Last sign-in
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {formatDate(user.last_sign_in_at)}
              </p>
            </div>
          </div>

          {showPasswordForm ? (
            <div className="border-b border-edge py-5">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-edge bg-surface">
                  <KeyRound className="h-4 w-4 text-muted" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
                    Change password
                  </p>
                  <form onSubmit={(ev) => void submitPasswordChange(ev)} className="mt-3 space-y-3">
                    {pwError ? (
                      <p
                        className="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800 dark:border-red-900/80 dark:bg-red-950/45 dark:text-red-300"
                        role="alert"
                      >
                        {pwError}
                      </p>
                    ) : null}
                    {pwSuccess ? (
                      <p className="rounded-xl border-2 border-primary/35 bg-primary-light px-3 py-2 text-sm font-bold text-foreground">
                        {pwSuccess}
                      </p>
                    ) : null}
                    <div>
                      <label
                        htmlFor="account-new-password"
                        className="block text-xs font-extrabold uppercase tracking-wide text-muted"
                      >
                        New password
                      </label>
                      <input
                        id="account-new-password"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPwError(null);
                          setPwSuccess(null);
                        }}
                        className="mt-1.5 w-full rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="account-confirm-password"
                        className="block text-xs font-extrabold uppercase tracking-wide text-muted"
                      >
                        Confirm new password
                      </label>
                      <input
                        id="account-confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPwError(null);
                          setPwSuccess(null);
                        }}
                        className="mt-1.5 w-full rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-bold text-foreground shadow-[0_2px_0_var(--edge)] placeholder:font-normal placeholder:text-muted focus:border-primary focus:shadow-[0_2px_0_var(--primary)] focus:outline-none"
                        placeholder="Repeat password"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full rounded-xl border-2 border-primary-dark bg-primary py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:shadow-none sm:w-auto sm:px-6"
                    >
                      {pwLoading ? "Updating…" : "Update password"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <p className="border-b border-edge py-4 text-sm leading-relaxed text-muted">
              You signed in with a social provider, so there is no Nibble password
              to change. Use that provider&apos;s security settings if you need to
              update credentials.
            </p>
          )}
        </div>

        <div className="border-t-2 border-edge px-6 py-5 sm:px-8">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
            Quick links
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-extrabold text-foreground transition hover:border-primary/50 hover:bg-primary-light"
              >
                <Compass className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Discover
              </Link>
            </li>
            <li>
              <Link
                href="/box"
                className="flex items-center gap-2 rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-extrabold text-foreground transition hover:border-primary/50 hover:bg-primary-light"
              >
                <BookmarkCheck
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                Recipe box
              </Link>
            </li>
            <li>
              <Link
                href="/friends"
                className="flex items-center gap-2 rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-extrabold text-foreground transition hover:border-primary/50 hover:bg-primary-light"
              >
                <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Friends
              </Link>
            </li>
            <li>
              <Link
                href="/points"
                className="flex items-center gap-2 rounded-xl border-2 border-edge bg-surface px-3 py-2.5 text-sm font-extrabold text-foreground transition hover:border-primary/50 hover:bg-primary-light"
              >
                <Trophy className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Points
              </Link>
            </li>
          </ul>
        </div>

        <div className="border-t-2 border-edge px-6 py-6 sm:px-8">
          <button
            type="button"
            onClick={() => void signOut()}
            className={`inline-flex w-full items-center justify-center gap-2 sm:w-auto ${outlinedAuthButtonClass} px-8 py-2.5`}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

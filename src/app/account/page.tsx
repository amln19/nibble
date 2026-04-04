"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
  }, [router]);

  if (user === undefined) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-surface" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-primary-light text-3xl shadow-[0_4px_0_var(--primary)]">
          👤
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to sync preferences across devices.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-2xl border-2 border-primary-dark bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="mt-4 text-sm font-bold text-muted underline-offset-2 hover:text-primary-dark hover:underline"
        >
          &larr; Back to Discover
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-12">
      <h1 className="text-2xl font-extrabold text-foreground">
        Account
      </h1>
      <div className="mt-4 rounded-2xl border-2 border-edge bg-card p-5 shadow-[0_4px_0_var(--edge)]">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
          Signed in as
        </p>
        <p className="mt-1 break-all text-base font-extrabold text-foreground">
          {user.email}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 w-full rounded-2xl border-2 border-edge bg-card py-2.5 text-sm font-extrabold text-foreground shadow-[0_4px_0_var(--edge)] transition-all hover:border-red-300 hover:text-red-600 active:translate-y-1 active:shadow-none sm:w-auto sm:px-8"
      >
        Sign out
      </button>
      <Link
        href="/"
        className="mt-6 text-sm font-bold text-muted underline-offset-2 hover:text-primary-dark hover:underline"
      >
        &larr; Back to Discover
      </Link>
    </main>
  );
}

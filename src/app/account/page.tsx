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
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold text-zinc-900">
          Account
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to sync preferences across devices (coming soon).
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-600"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="mt-4 text-sm text-zinc-500 underline-offset-2 hover:text-rose-600 hover:underline"
        >
          ← Back to Discover
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-12">
      <h1 className="font-serif text-2xl font-semibold text-zinc-900">
        Account
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Signed in as</p>
      <p className="mt-1 break-all font-medium text-zinc-800">{user.email}</p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-8 w-full rounded-xl border border-rose-200 bg-white py-2.5 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-pink-50 sm:w-auto sm:px-8"
      >
        Sign out
      </button>
      <Link
        href="/"
        className="mt-6 text-sm text-zinc-500 underline-offset-2 hover:text-rose-600 hover:underline"
      >
        ← Back to Discover
      </Link>
    </main>
  );
}

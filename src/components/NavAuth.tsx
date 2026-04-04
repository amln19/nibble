"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function NavAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (loading) {
    return (
      <span className="h-4 w-16 shrink-0 animate-pulse rounded bg-zinc-100" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="hidden max-w-[10rem] truncate text-sm text-zinc-600 sm:inline"
          title={user.email ?? ""}
        >
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm font-medium text-zinc-600 transition hover:text-green-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm font-medium text-green-600 transition hover:text-green-700"
    >
      Sign in
    </Link>
  );
}

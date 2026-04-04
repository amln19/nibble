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
      <span className="h-4 w-16 shrink-0 animate-pulse rounded-lg bg-surface" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="hidden max-w-40 truncate text-sm text-muted sm:inline"
          title={user.email ?? ""}
        >
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-xl border-2 border-edge px-3 py-1.5 text-sm font-bold text-muted transition-all hover:border-edge-hover hover:text-foreground active:translate-y-0.5"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-xl border-2 border-primary bg-primary-light px-4 py-1.5 text-sm font-extrabold text-primary-dark transition-all hover:bg-primary hover:text-white active:translate-y-0.5"
    >
      Sign in
    </Link>
  );
}

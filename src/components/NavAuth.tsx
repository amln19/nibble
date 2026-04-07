"use client";

import { createClient } from "@/lib/supabase/client";
import { outlinedAuthButtonClass } from "@/lib/auth-ui";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { UserRound } from "lucide-react";

export function NavAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => createClient() !== null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
  }, [router]);

  if (loading) {
    return (
      <span className="h-8 w-24 shrink-0 animate-pulse rounded-xl bg-surface" />
    );
  }

  if (user) {
    const accountActive = pathname === "/account";
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/account"
          title={user.email ?? "Account"}
          className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition-all sm:px-4 ${
            accountActive
              ? "border-primary bg-primary-light text-primary-dark shadow-[0_2px_0_var(--primary)]"
              : "border-transparent text-muted hover:border-edge hover:text-foreground"
          }`}
        >
          <UserRound size={15} aria-hidden />
          <span className="max-w-30 truncate sm:max-w-36">Account</span>
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className={`shrink-0 ${outlinedAuthButtonClass}`}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className={outlinedAuthButtonClass}>
      Sign in
    </Link>
  );
}

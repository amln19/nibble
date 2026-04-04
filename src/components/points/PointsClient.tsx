"use client";

import { createClient } from "@/lib/supabase/client";
import {
  ACHIEVEMENTS,
  TIERS,
  getCookSessions,
  getTier,
  resolveAchievements,
  type Achievement,
  type AchievementCategory,
  type UserStats,
} from "@/lib/achievements";
import {
  BookmarkCheck,
  Camera,
  ChefHat,
  Check,
  Heart,
  Lock,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

// ── Category meta ─────────────────────────────────────────────────────────────

type CategoryMeta = {
  label: string;
  Icon: (props: { size?: number; className?: string }) => ReactNode;
  iconClass: string;
};

const CATEGORY_META: Record<AchievementCategory, CategoryMeta> = {
  saver:   { label: "Recipe Saver", Icon: BookmarkCheck, iconClass: "text-primary-dark" },
  creator: { label: "Creator",      Icon: Camera,        iconClass: "text-primary-dark" },
  chef:    { label: "Cook-Along",   Icon: ChefHat,       iconClass: "text-golden" },
  social:  { label: "Social",       Icon: Heart,         iconClass: "text-sky-600 dark:text-sky-400" },
};

const CATEGORY_ORDER: AchievementCategory[] = ["saver", "creator", "chef", "social"];

/** Per-category accent for unlocked achievements (spreads color beyond primary pink). */
const CATEGORY_ACCENT: Record<
  AchievementCategory,
  {
    leftBar: string;
    iconBg: string;
    iconBorder: string;
    iconText: string;
  }
> = {
  saver: {
    leftBar: "border-l-primary",
    iconBg: "bg-primary/10",
    iconBorder: "border-primary/40",
    iconText: "text-primary-dark",
  },
  creator: {
    leftBar: "border-l-primary",
    iconBg: "bg-primary/12",
    iconBorder: "border-primary/45",
    iconText: "text-primary-dark",
  },
  chef: {
    leftBar: "border-l-golden",
    iconBg: "bg-golden/15",
    iconBorder: "border-golden/50",
    iconText: "text-golden",
  },
  social: {
    leftBar: "border-l-sky-500 dark:border-l-sky-400",
    iconBg: "bg-sky-500/10 dark:bg-sky-400/12",
    iconBorder: "border-sky-400/45",
    iconText: "text-sky-600 dark:text-sky-300",
  },
};

// ── Achievement card ──────────────────────────────────────────────────────────

function AchievementCard({
  achievement,
  unlocked,
  stats,
}: {
  achievement: Achievement;
  unlocked: boolean;
  stats: UserStats;
}) {
  const accent = CATEGORY_ACCENT[achievement.category];
  const statMap: Record<AchievementCategory, number> = {
    saver:   stats.savedCount,
    creator: stats.postsCount,
    chef:    stats.cookSessions,
    social:  stats.likesReceived,
  };
  const current = Math.min(statMap[achievement.category], achievement.threshold);
  const pct = Math.round((current / achievement.threshold) * 100);

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border-2 border-edge bg-card p-4 shadow-[0_3px_0_var(--edge)] transition-all ${
        unlocked ? `border-l-4 ${accent.leftBar}` : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
            unlocked
              ? `${accent.iconBorder} ${accent.iconBg} ${accent.iconText}`
              : "border-edge bg-elevated text-muted"
          }`}
        >
          {unlocked ? (
            <Check size={18} strokeWidth={3} />
          ) : (
            <Lock size={15} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-extrabold leading-tight text-foreground">
              {achievement.title}
            </p>
            <span
              className={`ml-auto shrink-0 rounded-lg border px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                unlocked
                  ? "border-edge bg-surface text-foreground"
                  : "border-edge text-muted"
              }`}
            >
              +{achievement.points} pts
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">{achievement.description}</p>
        </div>
      </div>

      {/* Progress bar (locked only) */}
      {!unlocked && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary/80 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-right text-[10px] font-bold text-muted">
            {current} / {achievement.threshold}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PointsClient() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const [savedRes, postsRes, likesRes] = await Promise.all([
        supabase
          .from("saved_recipes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("creations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        // Count likes received: find all creations by this user, then count their likes
        (async () => {
          const { data: userCreations } = await supabase
            .from("creations")
            .select("id")
            .eq("user_id", user.id);

          if (!userCreations || userCreations.length === 0) {
            return { count: 0 };
          }

          const creationIds = userCreations.map(c => c.id);
          const { count } = await supabase
            .from("creation_likes")
            .select("id", { count: "exact", head: true })
            .in("creation_id", creationIds);

          return { count: count ?? 0 };
        })(),
      ]);

      setStats({
        savedCount:    savedRes.count ?? 0,
        postsCount:    postsRes.count ?? 0,
        cookSessions:  getCookSessions(),
        likesReceived: likesRes.count ?? 0,
      });
      setLoading(false);
    }

    void load();
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-8xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-8">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-surface" />
        <div className="mt-6 h-36 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  // ── Logged-out state ────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="mx-auto flex w-full max-w-8xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-golden/50 bg-golden/15 shadow-[0_4px_0_rgba(255,184,0,0.35)]">
          <Trophy size={24} className="text-golden" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Points &amp; Achievements</h1>
        <p className="mt-2 text-sm text-muted">Sign in to track your progress and earn rewards.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-2xl border-2 border-primary-dark bg-primary px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_var(--primary-dark)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-none"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { unlocked, totalPoints } = resolveAchievements(stats!);
  const tier = getTier(totalPoints);
  const totalPossible = ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="mx-auto w-full max-w-8xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 md:pb-8">

      {/* ── Page header ── */}
      <header className="mb-6 rounded-3xl border-2 border-primary/40 bg-primary/5 px-6 py-5 shadow-[0_4px_0_var(--primary)]">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Points &amp; Achievements
        </h1>
        <p className="mt-1 text-sm text-foreground">
          {unlocked.length} of {ACHIEVEMENTS.length} unlocked · {totalPoints} pts earned
        </p>
      </header>

      {/* ── Rank card (neutral shell; golden + pink progress) ── */}
      <div className="overflow-hidden rounded-2xl border-2 border-edge bg-card shadow-[0_4px_0_var(--edge)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Tier icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-golden/45 bg-golden/12">
            <Trophy size={26} className="text-golden" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted">
              Current rank
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-foreground">{tier.label}</p>
            <p className="text-sm text-muted">{tier.tagline}</p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-3xl font-extrabold tabular-nums text-foreground">
              {totalPoints}
              <span className="ml-1 text-base font-bold text-golden">pts</span>
            </p>
            <p className="text-xs font-bold text-muted">{totalPossible} pts possible</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {tier.nextTier && (
          <div className="border-t-2 border-edge bg-surface/80 px-5 py-3">
            <div className="mb-2 flex justify-between text-[11px] font-extrabold text-muted">
              <span className="text-foreground">{tier.label}</span>
              <span>
                {tier.nextTier.label} — {tier.nextTier.minPoints} pts
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${tier.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tier ladder ── */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {TIERS.map((t) => {
          const reached = totalPoints >= t.minPoints;
          const isCurrent = tier.label === t.label;
          return (
            <div
              key={t.label}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 px-1 text-center transition-all ${
                isCurrent
                  ? "border-golden/55 bg-golden/10 shadow-[0_2px_0_rgba(255,184,0,0.4)]"
                  : reached
                  ? "border-edge bg-card"
                  : "border-edge bg-card opacity-40"
              }`}
            >
              <span className="text-[10px] font-extrabold leading-tight text-foreground">
                {t.label}
              </span>
              <span
                className={`text-[9px] font-bold ${
                  isCurrent ? "text-golden" : "text-muted"
                }`}
              >
                {t.minPoints}+
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Stats strip ── */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {(
          [
            {
              label: "Saved",
              value: stats!.savedCount,
              Icon: BookmarkCheck,
              iconClass: "text-primary-dark",
            },
            {
              label: "Posts",
              value: stats!.postsCount,
              Icon: Camera,
              iconClass: "text-primary-dark",
            },
            {
              label: "Cooked",
              value: stats!.cookSessions,
              Icon: UtensilsCrossed,
              iconClass: "text-golden",
            },
            {
              label: "Likes",
              value: stats!.likesReceived,
              Icon: Heart,
              iconClass: "text-sky-600 dark:text-sky-400",
            },
          ] as const
        ).map(({ label, value, Icon, iconClass }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-edge bg-card py-4 shadow-[0_3px_0_var(--edge)]"
          >
            <Icon size={16} className={iconClass} />
            <span className="text-xl font-extrabold tabular-nums text-foreground">{value}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Achievements by category ── */}
      <div className="mt-10 space-y-10">
        {CATEGORY_ORDER.map((cat) => {
          const { label, Icon, iconClass } = CATEGORY_META[cat];
          const inCat = ACHIEVEMENTS.filter((a) => a.category === cat);
          const unlockedInCat = unlocked.filter((a) => a.category === cat);

          return (
            <section key={cat}>
              <div className="mb-3 flex items-center gap-2 border-b-2 border-edge pb-2">
                <Icon size={15} className={`shrink-0 ${iconClass}`} />
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground">
                  {label}
                </h2>
                <span className="ml-auto text-xs font-bold text-muted">
                  {unlockedInCat.length} / {inCat.length}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inCat.map((a) => (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    unlocked={unlocked.some((u) => u.id === a.id)}
                    stats={stats!}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

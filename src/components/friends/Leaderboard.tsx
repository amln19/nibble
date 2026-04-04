"use client";

import { getTier } from "@/lib/achievements";
import { Trophy, Crown, Medal } from "lucide-react";

type LeaderboardEntry = {
  id: string;
  username: string;
  isMe: boolean;
  totalPoints: number;
  stats: {
    savedCount: number;
    postsCount: number;
    cookSessions: number;
    likesReceived: number;
  };
};

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const PODIUM_STYLES = [
  {
    // 1st — Gold
    border: "border-golden",
    bg: "bg-golden/12",
    shadow: "shadow-[0_6px_0_rgba(255,184,0,0.4)]",
    iconBg: "bg-golden/20",
    iconBorder: "border-golden/50",
    textColor: "text-golden",
    size: "h-20 w-20",
    label: "🥇",
  },
  {
    // 2nd — Silver
    border: "border-edge-hover",
    bg: "bg-surface",
    shadow: "shadow-[0_4px_0_var(--edge)]",
    iconBg: "bg-edge/30",
    iconBorder: "border-edge-hover",
    textColor: "text-muted",
    size: "h-16 w-16",
    label: "🥈",
  },
  {
    // 3rd — Bronze
    border: "border-orange-400/50",
    bg: "bg-orange-400/8",
    shadow: "shadow-[0_4px_0_rgba(251,146,60,0.3)]",
    iconBg: "bg-orange-400/15",
    iconBorder: "border-orange-400/40",
    textColor: "text-orange-500",
    size: "h-16 w-16",
    label: "🥉",
  },
];

function PodiumCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const style = PODIUM_STYLES[rank] ?? PODIUM_STYLES[2];
  const tier = getTier(entry.totalPoints);

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 ${style.border} ${style.bg} ${style.shadow} p-4 transition-all ${
        entry.isMe ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
    >
      {/* Medal icon */}
      <span className="text-2xl">{style.label}</span>

      {/* Avatar */}
      <div
        className={`flex ${style.size} items-center justify-center rounded-full border-2 ${style.iconBorder} ${style.iconBg} text-lg font-extrabold ${style.textColor}`}
      >
        {getInitials(entry.username)}
      </div>

      {/* Username */}
      <p className={`text-sm font-extrabold ${entry.isMe ? "text-primary-dark" : "text-foreground"} truncate max-w-[120px]`}>
        {entry.username}
        {entry.isMe ? " (you)" : ""}
      </p>

      {/* Points */}
      <p className="text-xl font-extrabold tabular-nums text-foreground">
        {entry.totalPoints}
        <span className="ml-1 text-xs font-bold text-golden">pts</span>
      </p>

      {/* Tier */}
      <span className="rounded-full border border-edge bg-surface px-2 py-0.5 text-[10px] font-extrabold text-muted">
        {tier.emoji} {tier.label}
      </span>
    </div>
  );
}

function RankedRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const tier = getTier(entry.totalPoints);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all ${
        entry.isMe
          ? "border-primary bg-primary-light shadow-[0_3px_0_var(--primary)]"
          : "border-edge bg-card shadow-[0_3px_0_var(--edge)]"
      }`}
    >
      {/* Rank number */}
      <span className="w-8 shrink-0 text-center text-sm font-extrabold tabular-nums text-muted">
        #{rank}
      </span>

      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-edge bg-surface text-xs font-extrabold text-muted">
        {getInitials(entry.username)}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-extrabold ${entry.isMe ? "text-primary-dark" : "text-foreground"}`}>
          {entry.username}
          {entry.isMe ? " (you)" : ""}
        </p>
        <p className="text-[10px] font-bold text-muted">
          {tier.emoji} {tier.label}
        </p>
      </div>

      {/* Points */}
      <span className="shrink-0 text-base font-extrabold tabular-nums text-foreground">
        {entry.totalPoints}
        <span className="ml-0.5 text-[10px] font-bold text-golden">pts</span>
      </span>
    </div>
  );
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-edge bg-surface py-12 text-center shadow-[0_3px_0_var(--edge)]">
        <Trophy size={28} className="mx-auto text-muted" />
        <p className="mt-3 font-extrabold text-foreground">No one here yet</p>
        <p className="mt-1 text-sm text-muted">
          Add friends to start competing on the leaderboard!
        </p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : [top3[0]];

  return (
    <div>
      {/* Podium header */}
      <div className="mb-4 flex items-center gap-2">
        <Crown size={16} className="text-golden" />
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted">
          Podium
        </h3>
      </div>

      {/* Podium cards */}
      <div className={`grid gap-3 ${
        podiumOrder.length === 1
          ? "grid-cols-1 max-w-xs mx-auto"
          : podiumOrder.length === 2
          ? "grid-cols-2 max-w-md mx-auto"
          : "grid-cols-3"
      }`}>
        {podiumOrder.map((entry, i) => {
          // Map display position back to actual rank
          const actualRank = podiumOrder.length >= 3
            ? [1, 0, 2][i]
            : podiumOrder.length === 2
            ? [1, 0][i]
            : 0;
          return (
            <div key={entry.id} className={actualRank === 0 ? "lg:-mt-4" : "lg:mt-4"}>
              <PodiumCard entry={entry} rank={actualRank} />
            </div>
          );
        })}
      </div>

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Medal size={14} className="text-muted" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted">
              Rankings
            </h3>
          </div>
          <div className="space-y-2">
            {rest.map((entry, i) => (
              <RankedRow key={entry.id} entry={entry} rank={i + 4} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

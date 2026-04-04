// ── Types ─────────────────────────────────────────────────────────────────────

export type AchievementCategory = "saver" | "creator" | "chef" | "social";

export type Achievement = {
  id: string;
  category: AchievementCategory;
  emoji: string;
  title: string;
  description: string;
  /** Stat threshold required to unlock */
  threshold: number;
  /** Points awarded when unlocked */
  points: number;
};

export type UserStats = {
  savedCount: number;
  postsCount: number;
  cookSessions: number;
  likesReceived: number;
};

export type Tier = {
  label: string;
  emoji: string;
  minPoints: number;
  tagline: string;
};

// ── Tier definitions ──────────────────────────────────────────────────────────

export const TIERS: Tier[] = [
  { label: "Raw Egg",           emoji: "🥚", minPoints: 0,   tagline: "Just cracking the shell" },
  { label: "Chick",             emoji: "🐣", minPoints: 50,  tagline: "Finding your flavor" },
  { label: "Home Cook",         emoji: "🍳", minPoints: 150, tagline: "Heating things up" },
  { label: "Chef",              emoji: "👨‍🍳", minPoints: 300, tagline: "Running the kitchen" },
  { label: "Gordon's Favorite", emoji: "⭐", minPoints: 600, tagline: "Legendary status" },
];

export function getTier(totalPoints: number): Tier & { nextTier: Tier | null; progress: number } {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (totalPoints >= tier.minPoints) current = tier;
  }
  const currentIdx = TIERS.indexOf(current);
  const nextTier = TIERS[currentIdx + 1] ?? null;
  const progress = nextTier
    ? Math.min(
        100,
        Math.round(
          ((totalPoints - current.minPoints) / (nextTier.minPoints - current.minPoints)) * 100,
        ),
      )
    : 100;
  return { ...current, nextTier, progress };
}

// ── Achievement definitions ───────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // Saver
  {
    id: "save_1",
    category: "saver",
    emoji: "🔖",
    title: "First Bookmark",
    description: "Save your first recipe",
    threshold: 1,
    points: 10,
  },
  {
    id: "save_5",
    category: "saver",
    emoji: "📚",
    title: "Recipe Collector",
    description: "Save 5 recipes",
    threshold: 5,
    points: 25,
  },
  {
    id: "save_10",
    category: "saver",
    emoji: "📖",
    title: "Cookbook",
    description: "Save 10 recipes",
    threshold: 10,
    points: 50,
  },
  {
    id: "save_25",
    category: "saver",
    emoji: "🏛️",
    title: "Culinary Library",
    description: "Save 25 recipes",
    threshold: 25,
    points: 100,
  },

  // Creator
  {
    id: "post_1",
    category: "creator",
    emoji: "📸",
    title: "First Creation",
    description: "Share your first dish photo",
    threshold: 1,
    points: 15,
  },
  {
    id: "post_5",
    category: "creator",
    emoji: "🎨",
    title: "Food Blogger",
    description: "Share 5 dish photos",
    threshold: 5,
    points: 50,
  },
  {
    id: "post_10",
    category: "creator",
    emoji: "🖼️",
    title: "Chef's Gallery",
    description: "Share 10 dish photos",
    threshold: 10,
    points: 100,
  },

  // Chef (cook sessions with Gordon)
  {
    id: "cook_1",
    category: "chef",
    emoji: "🪿",
    title: "Apprentice Chef",
    description: "Complete 1 cook-along with Gordon",
    threshold: 1,
    points: 20,
  },
  {
    id: "cook_5",
    category: "chef",
    emoji: "🧑‍🍳",
    title: "Sous Chef",
    description: "Complete 5 cook-alongs with Gordon",
    threshold: 5,
    points: 50,
  },
  {
    id: "cook_15",
    category: "chef",
    emoji: "🏆",
    title: "Head Chef",
    description: "Complete 15 cook-alongs with Gordon",
    threshold: 15,
    points: 100,
  },

  // Social (likes received)
  {
    id: "likes_1",
    category: "social",
    emoji: "❤️",
    title: "First Fan",
    description: "Receive your first like",
    threshold: 1,
    points: 10,
  },
  {
    id: "likes_10",
    category: "social",
    emoji: "🌟",
    title: "Rising Star",
    description: "Receive 10 likes on your posts",
    threshold: 10,
    points: 30,
  },
  {
    id: "likes_50",
    category: "social",
    emoji: "💎",
    title: "Community Darling",
    description: "Receive 50 likes on your posts",
    threshold: 50,
    points: 75,
  },
];

// ── Stat resolver ─────────────────────────────────────────────────────────────

function statForAchievement(a: Achievement, stats: UserStats): number {
  switch (a.category) {
    case "saver":   return stats.savedCount;
    case "creator": return stats.postsCount;
    case "chef":    return stats.cookSessions;
    case "social":  return stats.likesReceived;
  }
}

export function resolveAchievements(stats: UserStats): {
  unlocked: Achievement[];
  locked: Achievement[];
  totalPoints: number;
} {
  const unlocked: Achievement[] = [];
  const locked: Achievement[] = [];
  let totalPoints = 0;

  for (const a of ACHIEVEMENTS) {
    if (statForAchievement(a, stats) >= a.threshold) {
      unlocked.push(a);
      totalPoints += a.points;
    } else {
      locked.push(a);
    }
  }

  return { unlocked, locked, totalPoints };
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const COOK_SESSIONS_KEY = "nibble_cook_sessions";

export function getCookSessions(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(COOK_SESSIONS_KEY) ?? "0", 10);
}

export function incrementCookSessions(): void {
  if (typeof window === "undefined") return;
  const current = getCookSessions();
  localStorage.setItem(COOK_SESSIONS_KEY, String(current + 1));
}

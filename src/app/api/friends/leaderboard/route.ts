import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get friend IDs
  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a
  );

  const allIds = [user.id, ...friendIds];

  // Get profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", allIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  // Get stats for each user: saved_recipes count, creations count, likes received
  const leaderboard = await Promise.all(
    allIds.map(async (uid) => {
      const [savedRes, postsRes, likesRes] = await Promise.all([
        supabase
          .from("saved_recipes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("creations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("creation_likes")
          .select("id", { count: "exact", head: true })
          .eq("creation_id", uid), // This won't work perfectly for likes received — see below
      ]);

      // For likes received, we need to count likes on this user's creations
      const { data: userCreations } = await supabase
        .from("creations")
        .select("id")
        .eq("user_id", uid);

      let likesReceived = 0;
      if (userCreations && userCreations.length > 0) {
        const creationIds = userCreations.map((c) => c.id);
        const { count } = await supabase
          .from("creation_likes")
          .select("id", { count: "exact", head: true })
          .in("creation_id", creationIds);
        likesReceived = count ?? 0;
      }

      // Compute points using the same achievement logic
      const stats = {
        savedCount: savedRes.count ?? 0,
        postsCount: postsRes.count ?? 0,
        cookSessions: 0, // We can't access localStorage from server, passed via client
        likesReceived,
      };

      // Inline points calculation (mirrors lib/achievements)
      const thresholds = [
        { cat: "saver", levels: [{ t: 1, p: 10 }, { t: 5, p: 25 }, { t: 10, p: 50 }, { t: 25, p: 100 }] },
        { cat: "creator", levels: [{ t: 1, p: 15 }, { t: 5, p: 50 }, { t: 10, p: 100 }] },
        { cat: "chef", levels: [{ t: 1, p: 20 }, { t: 5, p: 50 }, { t: 15, p: 100 }] },
        { cat: "social", levels: [{ t: 1, p: 10 }, { t: 10, p: 30 }, { t: 50, p: 75 }] },
      ];

      const statMap: Record<string, number> = {
        saver: stats.savedCount,
        creator: stats.postsCount,
        chef: stats.cookSessions,
        social: stats.likesReceived,
      };

      let totalPoints = 0;
      for (const { cat, levels } of thresholds) {
        for (const { t, p } of levels) {
          if (statMap[cat] >= t) totalPoints += p;
        }
      }

      return {
        id: uid,
        username: profileMap.get(uid) ?? "Unknown",
        isMe: uid === user.id,
        totalPoints,
        stats,
      };
    })
  );

  // Sort by points descending
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json({ leaderboard });
}

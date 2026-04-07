import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function bumpCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get friend IDs
  const { data: friendships, error: friendshipsErr } = await supabase
    .from("friendships")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (friendshipsErr) {
    return NextResponse.json(
      { error: friendshipsErr.message },
      { status: 500 },
    );
  }

  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a,
  );

  const allIds = [...new Set([user.id, ...friendIds])];

  const [profilesRes, savedRes, creationsRes] = await Promise.all([
    supabase.from("profiles").select("id, username").in("id", allIds),
    supabase.from("saved_recipes").select("user_id").in("user_id", allIds),
    supabase.from("creations").select("id, user_id").in("user_id", allIds),
  ]);

  if (profilesRes.error) {
    return NextResponse.json(
      { error: profilesRes.error.message },
      { status: 500 },
    );
  }
  if (savedRes.error) {
    return NextResponse.json(
      { error: savedRes.error.message },
      { status: 500 },
    );
  }
  if (creationsRes.error) {
    return NextResponse.json(
      { error: creationsRes.error.message },
      { status: 500 },
    );
  }

  const profiles = profilesRes.data ?? [];
  const savedRows = savedRes.data ?? [];
  const creationRows = creationsRes.data ?? [];

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  const savedCountByUser = new Map<string, number>();
  for (const row of savedRows) {
    bumpCount(savedCountByUser, row.user_id);
  }

  const postsCountByUser = new Map<string, number>();
  const creationOwnerById = new Map<string, string>();
  for (const row of creationRows) {
    bumpCount(postsCountByUser, row.user_id);
    creationOwnerById.set(row.id, row.user_id);
  }

  let likesReceivedByUser = new Map<string, number>();
  const creationIds = creationRows.map((row) => row.id);
  if (creationIds.length > 0) {
    const { data: likesRows, error: likesErr } = await supabase
      .from("creation_likes")
      .select("creation_id")
      .in("creation_id", creationIds);
    if (likesErr) {
      return NextResponse.json({ error: likesErr.message }, { status: 500 });
    }

    likesReceivedByUser = new Map<string, number>();
    for (const like of likesRows ?? []) {
      const ownerId = creationOwnerById.get(like.creation_id);
      if (!ownerId) continue;
      bumpCount(likesReceivedByUser, ownerId);
    }
  }

  // Get stats for each user: saved_recipes count, creations count, likes received
  const thresholds = [
    {
      cat: "saver",
      levels: [
        { t: 1, p: 10 },
        { t: 5, p: 25 },
        { t: 10, p: 50 },
        { t: 25, p: 100 },
      ],
    },
    {
      cat: "creator",
      levels: [
        { t: 1, p: 15 },
        { t: 5, p: 50 },
        { t: 10, p: 100 },
      ],
    },
    {
      cat: "chef",
      levels: [
        { t: 1, p: 20 },
        { t: 5, p: 50 },
        { t: 15, p: 100 },
      ],
    },
    {
      cat: "social",
      levels: [
        { t: 1, p: 10 },
        { t: 10, p: 30 },
        { t: 50, p: 75 },
      ],
    },
  ];

  const leaderboard = allIds.map((uid) => {
    const stats = {
      savedCount: savedCountByUser.get(uid) ?? 0,
      postsCount: postsCountByUser.get(uid) ?? 0,
      cookSessions: 0,
      likesReceived: likesReceivedByUser.get(uid) ?? 0,
    };

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
  });

  // Sort by points descending
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json({ leaderboard });
}

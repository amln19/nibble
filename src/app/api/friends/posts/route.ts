import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  if (friendIds.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  // Get public posts from friends
  const { data: posts, error } = await supabase
    .from("creations")
    .select("*")
    .in("user_id", friendIds)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: posts ?? [] });
}

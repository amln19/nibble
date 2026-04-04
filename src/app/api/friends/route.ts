import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — list current user's friends
// POST — send a friend request by username
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all friendships where user is either side
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Extract friend IDs
  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a
  );

  if (friendIds.length === 0) return NextResponse.json({ friends: [] });

  // Get profiles for friends
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", friendIds);

  return NextResponse.json({ friends: profiles ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const username = (body.username ?? "").trim();
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  // Find the target user by username (case-insensitive)
  const { data: targets } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .limit(1);

  const target = targets?.[0] ?? null;

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  // Check if already friends
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .or(`and(user_a.eq.${user.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${user.id})`)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Already friends" }, { status: 409 });
  }

  // Check if request already pending
  const { data: pendingReq } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user", user.id)
    .eq("to_user", target.id)
    .eq("status", "pending")
    .limit(1);

  if (pendingReq && pendingReq.length > 0) {
    return NextResponse.json({ error: "Request already sent" }, { status: 409 });
  }

  // Check if the target already sent us a request — auto-accept
  const { data: incomingReq } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user", target.id)
    .eq("to_user", user.id)
    .eq("status", "pending")
    .limit(1);

  if (incomingReq && incomingReq.length > 0) {
    // Auto-accept: update request and create friendship
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", incomingReq[0].id);

    await supabase.from("friendships").insert({
      user_a: target.id < user.id ? target.id : user.id,
      user_b: target.id < user.id ? user.id : target.id,
    });

    return NextResponse.json({ status: "accepted", friend: target });
  }

  // Create new request
  const { error } = await supabase.from("friend_requests").insert({
    from_user: user.id,
    to_user: target.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: "sent" });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — list current user's friends
// POST — send a friend request by username
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all friendships where user is either side
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Extract friend IDs
  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a,
  );

  if (friendIds.length === 0) return NextResponse.json({ friends: [] });

  // Get profiles for friends
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", friendIds);

  if (profilesErr) {
    return NextResponse.json({ error: profilesErr.message }, { status: 500 });
  }

  return NextResponse.json({ friends: profiles ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof (body as { username?: unknown }).username === "string"
      ? (body as { username: string }).username.trim()
      : "";
  if (!username)
    return NextResponse.json({ error: "Username required" }, { status: 400 });

  // Find the target user by username (case-insensitive)
  const { data: targets, error: targetsErr } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .limit(1);

  if (targetsErr) {
    return NextResponse.json({ error: targetsErr.message }, { status: 500 });
  }

  const target = targets?.[0] ?? null;

  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id)
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  const a = target.id < user.id ? target.id : user.id;
  const b = target.id < user.id ? user.id : target.id;

  // Check if already friends
  const { data: existing, error: existingErr } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .limit(1);

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Already friends" }, { status: 409 });
  }

  // Check if request already pending
  const { data: pendingReq, error: pendingErr } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user", user.id)
    .eq("to_user", target.id)
    .eq("status", "pending")
    .limit(1);

  if (pendingErr) {
    return NextResponse.json({ error: pendingErr.message }, { status: 500 });
  }

  if (pendingReq && pendingReq.length > 0) {
    return NextResponse.json(
      { error: "Request already sent" },
      { status: 409 },
    );
  }

  // Check if the target already sent us a request — auto-accept
  const { data: incomingReq, error: incomingErr } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user", target.id)
    .eq("to_user", user.id)
    .eq("status", "pending")
    .limit(1);

  if (incomingErr) {
    return NextResponse.json({ error: incomingErr.message }, { status: 500 });
  }

  if (incomingReq && incomingReq.length > 0) {
    // Auto-accept: update request and create friendship
    const { error: acceptErr } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", incomingReq[0].id);
    if (acceptErr) {
      return NextResponse.json({ error: acceptErr.message }, { status: 500 });
    }

    const { error: friendshipErr } = await supabase
      .from("friendships")
      .insert({ user_a: a, user_b: b });
    if (friendshipErr && friendshipErr.code !== "23505") {
      const { error: rollbackErr } = await supabase
        .from("friend_requests")
        .update({ status: "pending" })
        .eq("id", incomingReq[0].id)
        .eq("status", "accepted");
      if (rollbackErr) {
        console.error("Failed to rollback friend request status:", rollbackErr);
      }
      return NextResponse.json(
        { error: friendshipErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "accepted", friend: target });
  }

  // Create new request
  const { error } = await supabase.from("friend_requests").insert({
    from_user: user.id,
    to_user: target.id,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: "sent" });
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET — list pending incoming friend requests
// POST — accept or reject a request
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: requests, error: requestsErr } = await supabase
    .from("friend_requests")
    .select("id, from_user, status, created_at")
    .eq("to_user", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (requestsErr) {
    return NextResponse.json({ error: requestsErr.message }, { status: 500 });
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  // Get usernames for the senders
  const senderIds = requests.map((r) => r.from_user);
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", senderIds);

  if (profilesErr) {
    return NextResponse.json({ error: profilesErr.message }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  const enriched = requests.map((r) => ({
    ...r,
    from_username: profileMap.get(r.from_user) ?? "Unknown",
  }));

  return NextResponse.json({ requests: enriched });
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

  const requestId =
    typeof (body as { requestId?: unknown }).requestId === "string"
      ? (body as { requestId: string }).requestId.trim()
      : "";
  const action =
    typeof (body as { action?: unknown }).action === "string"
      ? (body as { action: string }).action
      : "";

  if (
    !requestId ||
    !UUID_RE.test(requestId) ||
    !["accept", "reject"].includes(action)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the request belongs to this user
  const { data: req_, error: reqErr } = await supabase
    .from("friend_requests")
    .select("id, from_user, to_user, status")
    .eq("id", requestId)
    .eq("to_user", user.id)
    .single();

  if (reqErr) {
    if (reqErr.code === "PGRST116") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  if (req_.status !== "pending")
    return NextResponse.json({ error: "Already handled" }, { status: 409 });

  if (action === "reject") {
    const { error: rejectErr } = await supabase
      .from("friend_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);
    if (rejectErr) {
      return NextResponse.json({ error: rejectErr.message }, { status: 500 });
    }
    return NextResponse.json({ status: "rejected" });
  }

  // Accept: update request + create friendship
  const { error: acceptErr } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);
  if (acceptErr) {
    return NextResponse.json({ error: acceptErr.message }, { status: 500 });
  }

  const a = req_.from_user < user.id ? req_.from_user : user.id;
  const b = req_.from_user < user.id ? user.id : req_.from_user;

  const { error: friendshipErr } = await supabase
    .from("friendships")
    .insert({ user_a: a, user_b: b });
  if (friendshipErr && friendshipErr.code !== "23505") {
    const { error: rollbackErr } = await supabase
      .from("friend_requests")
      .update({ status: "pending" })
      .eq("id", requestId)
      .eq("status", "accepted");
    if (rollbackErr) {
      console.error("Failed to rollback friend request status:", rollbackErr);
    }
    return NextResponse.json({ error: friendshipErr.message }, { status: 500 });
  }

  return NextResponse.json({ status: "accepted" });
}

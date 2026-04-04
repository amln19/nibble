import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — list pending incoming friend requests
// POST — accept or reject a request
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: requests } = await supabase
    .from("friend_requests")
    .select("id, from_user, status, created_at")
    .eq("to_user", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!requests || requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  // Get usernames for the senders
  const senderIds = requests.map((r) => r.from_user);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", senderIds);

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { requestId, action } = body as { requestId: string; action: "accept" | "reject" };

  if (!requestId || !["accept", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the request belongs to this user
  const { data: req_ } = await supabase
    .from("friend_requests")
    .select("id, from_user, to_user, status")
    .eq("id", requestId)
    .eq("to_user", user.id)
    .single();

  if (!req_) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (req_.status !== "pending") return NextResponse.json({ error: "Already handled" }, { status: 409 });

  if (action === "reject") {
    await supabase
      .from("friend_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);
    return NextResponse.json({ status: "rejected" });
  }

  // Accept: update request + create friendship
  await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  const a = req_.from_user < user.id ? req_.from_user : user.id;
  const b = req_.from_user < user.id ? user.id : req_.from_user;

  await supabase.from("friendships").insert({ user_a: a, user_b: b });

  return NextResponse.json({ status: "accepted" });
}

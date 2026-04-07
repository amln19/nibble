import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const friendId =
    typeof (body as { friendId?: unknown }).friendId === "string"
      ? (body as { friendId: string }).friendId.trim()
      : "";
  if (!friendId)
    return NextResponse.json({ error: "friendId required" }, { status: 400 });
  if (!UUID_RE.test(friendId)) {
    return NextResponse.json({ error: "Invalid friendId" }, { status: 400 });
  }

  const a = friendId < user.id ? friendId : user.id;
  const b = friendId < user.id ? user.id : friendId;

  // Delete friendship row (canonical order)
  const { error: friendshipErr } = await supabase
    .from("friendships")
    .delete()
    .eq("user_a", a)
    .eq("user_b", b);
  if (friendshipErr) {
    return NextResponse.json({ error: friendshipErr.message }, { status: 500 });
  }

  // Also clean up any friend_requests between them (both directions)
  const { error: reqErrA } = await supabase
    .from("friend_requests")
    .delete()
    .eq("from_user", user.id)
    .eq("to_user", friendId);
  if (reqErrA) {
    return NextResponse.json({ error: reqErrA.message }, { status: 500 });
  }

  const { error: reqErrB } = await supabase
    .from("friend_requests")
    .delete()
    .eq("from_user", friendId)
    .eq("to_user", user.id);
  if (reqErrB) {
    return NextResponse.json({ error: reqErrB.message }, { status: 500 });
  }

  return NextResponse.json({ status: "removed" });
}

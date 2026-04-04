import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const friendId = body.friendId as string;
  if (!friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 });

  // Delete friendship row (either direction)
  await supabase
    .from("friendships")
    .delete()
    .or(`and(user_a.eq.${user.id},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${user.id})`);

  // Also clean up any friend_requests between them
  await supabase
    .from("friend_requests")
    .delete()
    .or(`and(from_user.eq.${user.id},to_user.eq.${friendId}),and(from_user.eq.${friendId},to_user.eq.${user.id})`);

  return NextResponse.json({ status: "removed" });
}

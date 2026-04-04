import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/friends/search?q=<query> — search users by partial username
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ users: [] });

  // Search profiles by partial username match (case insensitive), exclude self
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", `%${q}%`)
    .neq("id", user.id)
    .limit(8);

  return NextResponse.json({ users: profiles ?? [] });
}

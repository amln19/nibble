import { NextResponse } from "next/server";
import { madeiraCakeSim } from "@/lib/gordon/recipes/madeira-cake";

const CURATED: Record<string, unknown> = {
  "madeira cake": madeiraCakeSim,
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: string };
    const title = body.title ?? "";

    if (!title) {
      return NextResponse.json({ error: "Missing recipe title" }, { status: 400 });
    }

    const sim = CURATED[title.toLowerCase().trim()];
    if (!sim) {
      return NextResponse.json(
        { error: "No curated simulation for this recipe — use the client-side parser instead" },
        { status: 404 },
      );
    }

    return NextResponse.json({ simulation: sim });
  } catch (e) {
    console.error("Simulate route error:", e);
    return NextResponse.json({ error: "Failed to load simulation" }, { status: 500 });
  }
}

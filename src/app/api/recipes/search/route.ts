import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const s = searchParams.get("s")?.trim();
  if (!s || s.length < 2) {
    return NextResponse.json(
      { error: "Search needs at least 2 characters" },
      { status: 400 },
    );
  }

  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(s)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Search failed" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { meals?: unknown };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}

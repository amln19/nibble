import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const c = searchParams.get("c");
  if (!c?.trim()) {
    return NextResponse.json({ error: "Missing category c" }, { status: 400 });
  }

  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(c.trim())}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to filter meals" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { meals?: unknown };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to filter meals" },
      { status: 502 },
    );
  }
}

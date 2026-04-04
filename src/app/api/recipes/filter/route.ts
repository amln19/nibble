import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const c = searchParams.get("c");
  const a = searchParams.get("a");

  if (!c?.trim() && !a?.trim()) {
    return NextResponse.json({ error: "Missing category (c) or area (a)" }, { status: 400 });
  }

  const param = c?.trim()
    ? `c=${encodeURIComponent(c.trim())}`
    : `a=${encodeURIComponent(a!.trim())}`;
  const url = `https://www.themealdb.com/api/json/v1/1/filter.php?${param}`;

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

import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://www.themealdb.com/api/json/v1/1/list.php?i=list";

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache for 24 hours
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ingredients" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      meals?: { strIngredient: string }[];
    };
    
    // We only need the names
    const items = (data.meals || []).map((m) => m.strIngredient);
    return NextResponse.json({ ingredients: items });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch ingredients" },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";

const MEALDB = "https://www.themealdb.com/api/json/v1/1/categories.php";

export async function GET() {
  try {
    const res = await fetch(MEALDB, {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to load categories" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      categories?: unknown;
    };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 502 },
    );
  }
}

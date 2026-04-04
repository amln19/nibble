import { mealDetailToRecipe } from "@/lib/themealdb/parse";
import type { MealDbMealDetail } from "@/lib/themealdb/types";
import { NextResponse } from "next/server";

const LOOKUP = "https://www.themealdb.com/api/json/v1/1/lookup.php";

/** Batch lookup by comma-separated idMeal values (max 40) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam?.trim()) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);

  if (ids.length === 0) {
    return NextResponse.json({ recipes: [] });
  }

  try {
    const meals = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`${LOOKUP}?i=${encodeURIComponent(id)}`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { meals?: MealDbMealDetail[] | null };
        const m = data.meals?.[0];
        return m ?? null;
      }),
    );

    const recipes = meals
      .filter((m): m is MealDbMealDetail => m != null)
      .map(mealDetailToRecipe);

    return NextResponse.json({ recipes });
  } catch {
    return NextResponse.json(
      { error: "Failed to load recipe details" },
      { status: 502 },
    );
  }
}

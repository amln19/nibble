import type { Recipe } from "@/lib/recipes";
import { mealDetailToRecipe } from "@/lib/themealdb/parse";
import type { MealDbMealDetail } from "@/lib/themealdb/types";
import { NextResponse } from "next/server";

const LOOKUP = "https://www.themealdb.com/api/json/v1/1/lookup.php";

/** Parallel lookups per chunk — avoids hammering TheMealDB with hundreds at once */
const CHUNK_SIZE = 40;
const MAX_IDS = 100;

/** Batch lookup by comma-separated idMeal values (chunks of 40; order preserved) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam?.trim()) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  const ids = [
    ...new Set(
      idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];

  if (ids.length === 0) {
    return NextResponse.json({ recipes: [] });
  }

  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Too many ids. Maximum ${MAX_IDS}.` },
      { status: 400 },
    );
  }

  try {
    const recipes: Recipe[] = [];

    for (let offset = 0; offset < ids.length; offset += CHUNK_SIZE) {
      const chunk = ids.slice(offset, offset + CHUNK_SIZE);
      const meals = await Promise.all(
        chunk.map(async (id) => {
          const res = await fetch(`${LOOKUP}?i=${encodeURIComponent(id)}`, {
            next: { revalidate: 3600 },
          });
          if (!res.ok) return null;
          const data = (await res.json()) as {
            meals?: MealDbMealDetail[] | null;
          };
          const m = data.meals?.[0];
          return m ?? null;
        }),
      );

      const chunkRecipes = meals
        .filter((m): m is MealDbMealDetail => m != null)
        .map(mealDetailToRecipe);
      recipes.push(...chunkRecipes);
    }

    return NextResponse.json({ recipes });
  } catch {
    return NextResponse.json(
      { error: "Failed to load recipe details" },
      { status: 502 },
    );
  }
}

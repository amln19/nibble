import { NextResponse } from "next/server";

const MEALDB = "https://www.themealdb.com/api/json/v1/1/search.php";

/** Collect unique meal ids across a–z (MealDB “by first letter” search). */
export async function GET() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");

  try {
    const results = await Promise.all(
      letters.map(async (f) => {
        const res = await fetch(`${MEALDB}?f=${f}`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) return [] as { idMeal: string }[];
        const data = (await res.json()) as {
          meals?: { idMeal: string }[] | null;
        };
        return data.meals ?? [];
      }),
    );

    const seen = new Set<string>();
    const meals: { idMeal: string }[] = [];
    for (const list of results) {
      for (const m of list) {
        if (m?.idMeal && !seen.has(m.idMeal)) {
          seen.add(m.idMeal);
          meals.push({ idMeal: m.idMeal });
        }
      }
    }

    for (let i = meals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [meals[i], meals[j]] = [meals[j], meals[i]];
    }

    return NextResponse.json({ meals: meals.slice(0, 200) });
  } catch {
    return NextResponse.json(
      { error: "Failed to load meals", meals: [] },
      { status: 502 },
    );
  }
}

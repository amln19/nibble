import { normalizeIngredient } from "@/lib/ingredients";
import type { Recipe, RecipeTags } from "@/lib/recipes";
import type { MealDbMealDetail } from "./types";

function deriveTags(m: MealDbMealDetail): RecipeTags {
  const cat = (m.strCategory || "").toLowerCase();
  const tagStr = (m.strTags || "").toLowerCase();
  const words = (m.strInstructions || "").trim().split(/\s+/).filter(Boolean)
    .length;

  const vegan =
    /\bvegan\b/.test(cat) ||
    /\bvegan\b/.test(tagStr) ||
    (/\bvegetarian\b/.test(cat) && !/\bchicken\b|\bbeef\b|\bpork\b|\blamb\b/.test(tagStr));

  const highProtein =
    /\b(beef|chicken|seafood|pork|lamb|egg|shrimp|fish|turkey|steak|salmon|tuna|prawn)\b/i.test(
      cat + " " + tagStr,
    );

  const beginnerFriendly = words < 400;

  return { vegan, highProtein, beginnerFriendly };
}

/** Rough time from instruction length — API has no cook time */
function estimateMinutes(m: MealDbMealDetail): number {
  const words = (m.strInstructions || "").trim().split(/\s+/).filter(Boolean)
    .length;
  return Math.max(15, Math.min(90, Math.round(words / 6)));
}

export function mealDetailToRecipe(m: MealDbMealDetail): Recipe {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = `strIngredient${i}` as keyof MealDbMealDetail;
    const raw = m[key];
    if (typeof raw === "string" && raw.trim()) {
      ingredients.push(normalizeIngredient(raw));
    }
  }

  const tags = deriveTags(m);
  const timeMinutes = estimateMinutes(m);
  const cat = m.strCategory?.trim();
  const area = m.strArea?.trim();

  const instructions = (m.strInstructions || "").trim() || undefined;

  return {
    id: m.idMeal,
    title: m.strMeal || "Recipe",
    tagline:
      cat && area
        ? `${cat} · ${area}`
        : cat || area || "From TheMealDB",
    imageUrl: m.strMealThumb || "",
    timeMinutes,
    timeIsEstimate: true,
    tags,
    ingredients,
    instructions,
    source: "themealdb",
    category: cat,
    area: area,
  };
}

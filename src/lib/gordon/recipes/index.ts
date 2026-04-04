import type { Recipe } from "@/lib/recipes";
import type { RecipeSimulation } from "../simulation-types";
import { generateSimulation } from "../simulation-parser";
import { madeiraCakeSim } from "./madeira-cake";

const RECIPE_SIMS: Record<string, RecipeSimulation> = {
  "madeira cake": madeiraCakeSim,
};

export function getSimulation(recipe: Recipe): RecipeSimulation {
  const key = recipe.title.toLowerCase().trim();
  const curated = RECIPE_SIMS[key];
  if (curated) return curated;
  return generateSimulation(recipe);
}

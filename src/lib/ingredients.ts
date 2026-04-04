/** Normalize for pantry + recipe matching */
export function normalizeIngredient(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s-]/g, "");
}

/**
 * Ingredients most recipes assume you have (or that are tiny) — we don't require
 * an explicit pantry line for these when scoring coverage.
 */
const STAPLE_IGNORE = new Set(
  [
    "water",
    "salt",
    "sea salt",
    "table salt",
    "kosher salt",
    "black pepper",
    "pepper",
    "white pepper",
    "sugar",
    "white sugar",
    "brown sugar",
    "caster sugar",
    "icing sugar",
    "ice",
  ].map((s) => normalizeIngredient(s)),
);

/** Meaningful ingredients for pantry scoring (drops generic staples). */
export function significantIngredients(
  recipeIngredients: readonly string[],
): string[] {
  const out: string[] = [];
  for (const raw of recipeIngredients) {
    const n = normalizeIngredient(raw);
    if (!n || n.length < 2) continue;
    if (STAPLE_IGNORE.has(n)) continue;
    out.push(n);
  }
  return out;
}

/**
 * True if a pantry line (already normalized) can cover one recipe ingredient
 * (normalized). Uses substring / word overlap so e.g. pantry "chicken" matches
 * API text "chicken breast", and "tomato" matches "tomatoes".
 */
function pantryCoversIngredient(
  pantryNorm: string,
  ingredientNorm: string,
): boolean {
  if (!ingredientNorm) return true;
  if (!pantryNorm) return false;
  if (ingredientNorm === pantryNorm) return true;
  if (ingredientNorm.includes(pantryNorm)) return true;
  if (pantryNorm.includes(ingredientNorm)) return true;

  const ingWords = ingredientNorm.split(/\s+/).filter((w) => w.length > 0);
  const panWords = pantryNorm.split(/\s+/).filter((w) => w.length > 0);
  for (const pw of panWords) {
    if (pw.length < 2) continue;
    for (const iw of ingWords) {
      if (iw === pw) return true;
      if (iw.startsWith(pw) || pw.startsWith(iw)) return true;
    }
  }
  return false;
}

/**
 * How many significant ingredients are covered by the pantry (fuzzy).
 */
export function countPantryCoverage(
  significant: readonly string[],
  pantry: ReadonlySet<string>,
): number {
  const pantryList = [...pantry].map((p) => normalizeIngredient(p)).filter(Boolean);
  if (pantryList.length === 0 || significant.length === 0) return 0;

  let covered = 0;
  for (const ing of significant) {
    if (pantryList.some((p) => pantryCoversIngredient(p, ing))) covered++;
  }
  return covered;
}

/** Minimum matches needed vs how many meaningful ingredients the dish has */
function minMatchesForTotal(total: number): number {
  if (total <= 0) return 0;
  // Real recipes list 10–20+ lines; requiring 100% was impossible. Cap how many
  // distinct matches we ask for so a normal pantry still surfaces meals.
  return Math.min(6, Math.max(1, Math.ceil(total * 0.32)));
}

/**
 * Pantry mode: recipe qualifies if enough significant ingredients are covered
 * (not every single line from the API — TheMealDB lists salt, water, etc.).
 */
/**
 * Returns which recipe ingredients the pantry covers and which are missing.
 */
export function getShoppingList(
  recipeIngredients: readonly string[],
  pantry: ReadonlySet<string>,
): { have: string[]; need: string[] } {
  const pantryList = [...pantry].map((p) => normalizeIngredient(p)).filter(Boolean);
  const have: string[] = [];
  const need: string[] = [];

  for (const raw of recipeIngredients) {
    const n = normalizeIngredient(raw);
    if (!n || n.length < 2) continue;
    if (STAPLE_IGNORE.has(n)) {
      have.push(raw);
      continue;
    }
    const covered = pantryList.some((p) => pantryCoversIngredient(p, n));
    if (covered) {
      have.push(raw);
    } else {
      need.push(raw);
    }
  }

  return { have, need };
}

export function canMakeWithPantry(
  recipeIngredients: readonly string[],
  pantry: ReadonlySet<string>,
): boolean {
  const pantryList = [...pantry].map((p) => normalizeIngredient(p)).filter(Boolean);
  if (pantryList.length === 0) return false;

  const sig = significantIngredients(recipeIngredients);
  if (sig.length === 0) return true;

  const covered = countPantryCoverage(sig, pantry);
  const need = minMatchesForTotal(sig.length);
  return covered >= need;
}

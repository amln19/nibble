import type { Recipe } from "@/lib/recipes";
import type {
  RecipeSimulation,
  SimStep,
  DragStep,
  SelectStep,
  PourStep,
  MixStep,
  CrackStep,
  TemperatureStep,
  TimerStep,
  ChopStep,
  SauteStep,
  SeasonStep,
  SimmerStep,
  ActionStep,
} from "./simulation-types";
import { shuffle } from "@/lib/shuffle";

type StepType = SimStep["type"];

/* ─── deterministic pick helpers ─────────────────────────────────── */

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: readonly T[], seed: string): T {
  return arr[hash(seed) % arr.length];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function seededRange(lo: number, hi: number, seed: string): number {
  return lo + (hash(seed) % (hi - lo + 1));
}

/* ─── emoji map ──────────────────────────────────────────────────── */

const EMOJI: Record<string, string> = {
  chicken: "🍗", beef: "🥩", pork: "🥩", lamb: "🍖", steak: "🥩",
  fish: "🐟", salmon: "🐟", tuna: "🐟", cod: "🐟",
  shrimp: "🦐", prawn: "🦐",
  onion: "🧅", garlic: "🧄", tomato: "🍅", pepper: "🌶️", chilli: "🌶️",
  carrot: "🥕", potato: "🥔", mushroom: "🍄", broccoli: "🥦",
  lettuce: "🥬", corn: "🌽", cucumber: "🥒", avocado: "🥑",
  eggplant: "🍆", celery: "🥬", spinach: "🥬", pea: "🫛",
  lemon: "🍋", lime: "🍋", orange: "🍊", apple: "🍎",
  banana: "🍌", strawberry: "🍓", coconut: "🥥", pineapple: "🍍",
  mango: "🥭", grape: "🍇", kiwi: "🥝",
  egg: "🥚", milk: "🥛", butter: "🧈", cheese: "🧀",
  cream: "🥛", yogurt: "🥛",
  flour: "🌾", sugar: "🍬", rice: "🍚", pasta: "🍝",
  noodle: "🍜", bread: "🍞",
  oil: "🫒", olive: "🫒", salt: "🧂", honey: "🍯",
  chocolate: "🍫", vanilla: "🧁", cinnamon: "🫙",
  water: "💧", stock: "🫕", broth: "🫕", wine: "🍷",
  soy: "🥫", vinegar: "🫗", sauce: "🥫",
  ginger: "🫚", cumin: "🫙", paprika: "🫙",
  thyme: "🌿", basil: "🌿", parsley: "🌿", mint: "🌿",
  cilantro: "🌿", rosemary: "🌿", oregano: "🌿",
  bean: "🫘", lentil: "🫘", chickpea: "🫘",
  nut: "🥜", peanut: "🥜", almond: "🥜",
};

function emojiFor(ingredient: string): string {
  const l = ingredient.toLowerCase();
  for (const [k, e] of Object.entries(EMOJI)) {
    if (l.includes(k)) return e;
  }
  return "🥘";
}

/* ─── distractor pool for SelectGame ─────────────────────────────── */

const DISTRACTOR_POOL = [
  { name: "Chocolate", emoji: "🍫" }, { name: "Cheese", emoji: "🧀" },
  { name: "Peanuts", emoji: "🥜" }, { name: "Kiwi", emoji: "🥝" },
  { name: "Grapes", emoji: "🍇" }, { name: "Mango", emoji: "🥭" },
  { name: "Banana", emoji: "🍌" }, { name: "Coconut", emoji: "🥥" },
  { name: "Coffee", emoji: "☕" }, { name: "Maple Syrup", emoji: "🍁" },
  { name: "Tofu", emoji: "🧊" }, { name: "Popcorn", emoji: "🍿" },
  { name: "Jam", emoji: "🫙" }, { name: "Mustard", emoji: "🟡" },
  { name: "Pickles", emoji: "🥒" }, { name: "Sardines", emoji: "🐟" },
  { name: "Anchovies", emoji: "🐟" }, { name: "Cereal", emoji: "🥣" },
  { name: "Mayonnaise", emoji: "🫙" }, { name: "Squid", emoji: "🦑" },
  { name: "Pineapple", emoji: "🍍" }, { name: "Avocado", emoji: "🥑" },
  { name: "Soy Sauce", emoji: "🥫" }, { name: "Honey", emoji: "🍯" },
];

/* ─── tip templates per game type ────────────────────────────────── */

const TIPS: Record<string, { tip: string; mistakeTip: string }[]> = {
  drag: [
    { tip: "A clean, organized workspace makes cooking smoother and safer.", mistakeTip: "Prep your workspace first — saves time and prevents accidents." },
  ],
  select: [
    { tip: "Mise en place! Gather everything before you start for stress-free cooking.", mistakeTip: "Wrong ingredient! Always double-check the recipe list." },
  ],
  chop: [
    { tip: "Curl your fingers like a claw — keeps them safe from the blade.", mistakeTip: "Slow down! Rushing leads to uneven cuts." },
    { tip: "A sharp knife is safer than a dull one — less force, more control.", mistakeTip: "Uneven pieces cook at different rates. Keep cuts consistent." },
  ],
  mix: [
    { tip: "Fold gently to keep air in the mixture. Vigorous stirring deflates batters.", mistakeTip: "Don't overmix — that develops gluten and makes things tough." },
    { tip: "Mix until just combined. A few small lumps are fine in most batters.", mistakeTip: "Undermixing leaves pockets of dry ingredients. Keep going!" },
  ],
  pour: [
    { tip: "Pour slowly and steadily for better control over the amount.", mistakeTip: "Too much! Pour in small amounts — you can always add more." },
    { tip: "Measure liquids at eye level for accuracy.", mistakeTip: "Precision matters! A little too much liquid can change the whole dish." },
  ],
  crack: [
    { tip: "Crack eggs on a flat surface — fewer shell fragments that way.", mistakeTip: "Shell in the mix! Use a larger shell piece to scoop out fragments." },
  ],
  temperature: [
    { tip: "Always preheat! A cold oven means uneven cooking from the start.", mistakeTip: "Wrong temperature can ruin the dish — too hot burns, too cold undercooks." },
  ],
  timer: [
    { tip: "Use a timer! Don't trust your internal clock for precise cooking.", mistakeTip: "Don't open the oven too often — it lets heat escape." },
  ],
  saute: [
    { tip: "Don't overcrowd the pan — food steams instead of browning when packed tight.", mistakeTip: "Stirring too often prevents browning. Let it sit for a moment!" },
    { tip: "Make sure the pan is hot before adding food — you should hear a sizzle!", mistakeTip: "Cold pan + food = soggy results. Always preheat the pan." },
  ],
  season: [
    { tip: "Season in layers throughout cooking, not just at the end.", mistakeTip: "Over-seasoning is hard to fix! Add a little, taste, then add more." },
    { tip: "Taste as you go — your palate is the best measuring tool.", mistakeTip: "Under-seasoned food tastes flat. Don't be shy with the salt!" },
  ],
  simmer: [
    { tip: "A simmer has gentle small bubbles. A full boil can break delicate ingredients.", mistakeTip: "Too much heat! A vigorous boil makes sauces reduce too fast." },
    { tip: "Partially covering the pot helps maintain a steady simmer.", mistakeTip: "Too little heat means flavors won't develop. Find the sweet spot!" },
  ],
  action: [
    { tip: "Read the full step before starting — preparation prevents mistakes!", mistakeTip: "Take your time and follow each step carefully." },
  ],
};

function tipFor(type: string, seed: string) {
  const pool = TIPS[type] ?? TIPS.action!;
  return pick(pool, seed);
}

/* ─── instruction splitter ───────────────────────────────────────── */

function splitInstructions(text: string): string[] {
  if (!text?.trim()) return [];

  let steps = text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 12);

  if (steps.length < 3) {
    steps = text
      .split(/(?<=[.!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 12);
  }

  return steps.map(s => s.replace(/^\d+[\.)]\s*/, ""));
}

/* ─── step classifier ────────────────────────────────────────────── */

const PATTERNS: [RegExp, StepType][] = [
  [/\bpreheat\b|set\s+(the\s+)?oven|oven\s+to\s+\d+/i, "temperature"],
  [/\bcrack\b.*\begg|egg.*\bcrack\b/i, "crack"],

  [/\b(bake|roast|broil)\b.*\b\d+\s*(min|hour)/i, "timer"],
  [/\b(bake|roast|broil|grill)\b/i, "timer"],

  [/\b(saut[eé]|stir[- ]?fry|pan[- ]?fry|sear|deep[- ]?fry)\b/i, "saute"],
  [/\b(fry|brown)\b.*\b(pan|skillet|wok|oil)\b/i, "saute"],
  [/\bheat\b.*\b(oil|butter|pan|skillet|wok)\b/i, "saute"],

  [/\b(simmer|boil|reduce|braise|poach|bring\s+to\s+(a\s+)?boil)\b/i, "simmer"],

  [/\b(chop|dice|slice|mince|julienne|cut\s+up|peel\s+and\s+chop|finely\s+chop)\b/i, "chop"],

  [/\b(season|add\s+(salt|pepper|spice)|sprinkle|rub\s+with)\b/i, "season"],

  [/\b(mix|stir|combine|beat|whisk|fold|blend|cream)\b/i, "mix"],

  [/\b(pour|drizzle|add)\b.*\b(water|stock|broth|milk|cream|oil|sauce|juice|wine|coconut|beer|vinegar)\b/i, "pour"],

  [/\b(cook)\b.*\b\d+\s*min/i, "saute"],

  [/\bturn\b.*\bheat\b|\bheat\b.*\b(down|up|low|high|medium)\b/i, "simmer"],
  [/\b(stir\s+in|toss|flip)\b/i, "mix"],
  [/\b(knead|shape|form|roll\s+out|flatten|mash)\b/i, "mix"],
  [/\b(coat|marinate|dip|brush|glaze|rub)\b/i, "mix"],
  [/\b(place|put|transfer|arrange|serve|plate|garnish|set\s+aside|remove|take\s+out|drain|line)\b/i, "drag"],
  [/\b(let|leave)\b.*\b(rest|cool|stand|set|sit)\b/i, "timer"],
  [/\bcook\b/i, "saute"],
  [/\bheat\b/i, "simmer"],
  [/\badd\b/i, "drag"],
];

function classifyStep(text: string): StepType {
  for (const [re, type] of PATTERNS) {
    if (re.test(text)) return type;
  }
  return "action";
}

/* ─── subject extraction ─────────────────────────────────────────── */

function extractSubject(text: string): string {
  const m = text.match(
    /(?:chop|dice|slice|mince|cut|saut[eé]|fry|brown|season|add|pour)\s+(?:the\s+|up\s+)?(.+?)(?:\s+(?:in|into|to|until|for|and\s+(?:cook|fry|bake|stir))|[.,;]|$)/i,
  );
  if (m) {
    const subj = m[1].trim().replace(/\s+/g, " ");
    if (subj.length < 40) return subj;
  }
  return "";
}

function extractTemp(text: string): { temp: number; unit: string } | null {
  const m = text.match(/(\d{2,3})\s*°?\s*(C|F|celsius|fahrenheit)/i);
  if (!m) return null;
  const unit = m[2].toUpperCase().startsWith("F") ? "°F" : "°C";
  return { temp: parseInt(m[1], 10), unit };
}

function extractEggCount(text: string, ingredients: string[]): number {
  const m = text.match(/(\d+)\s*eggs?/i);
  if (m) return clamp(parseInt(m[1], 10), 1, 6);
  for (const ing of ingredients) {
    const im = ing.match(/^(\d+)\s*eggs?/i);
    if (im) return clamp(parseInt(im[1], 10), 1, 6);
  }
  return 2;
}

/* ─── step builders ──────────────────────────────────────────────── */

function createSetupStep(): DragStep {
  return {
    type: "drag",
    title: "Set Up Your Workspace",
    instruction: "Drag the mixing bowl onto the counter",
    emoji: "🥣",
    itemEmoji: "🥣",
    targetLabel: "Counter",
    ...tipFor("drag", "setup"),
  };
}

function createSelectStep(ingredients: string[]): SelectStep {
  const seen = new Set<string>();
  const correct: { name: string; emoji: string }[] = [];
  for (const i of ingredients) {
    const raw = capitalize(i.replace(/^\d+[\s/]*\w*\s+(?:of\s+)?/i, "").trim());
    const name = raw.length > 22 ? raw.slice(0, 20) + "…" : raw;
    const key = name.toLowerCase();
    if (seen.has(key) || !name) continue;
    seen.add(key);
    correct.push({ name, emoji: emojiFor(i) });
    if (correct.length >= 8) break;
  }

  const ingLower = ingredients.map(i => i.toLowerCase());
  const distractors = shuffle(
    DISTRACTOR_POOL.filter(d => !ingLower.some(il => il.includes(d.name.toLowerCase()))),
  ).slice(0, 7);

  return {
    type: "select",
    title: "Gather Your Ingredients",
    instruction: `Find all ${correct.length} ingredients`,
    emoji: "🧺",
    correct,
    distractors,
    ...tipFor("select", "select"),
  };
}

function buildStep(type: StepType, text: string, seed: string, recipe: Recipe): SimStep {
  const tips = tipFor(type, seed);
  const subj = extractSubject(text) || "ingredients";

  switch (type) {
    case "chop": {
      const s: ChopStep = {
        type: "chop",
        title: `Chop the ${capitalize(subj)}`,
        instruction: text,
        emoji: emojiFor(subj),
        ingredient: subj,
        targetChops: seededRange(8, 14, seed),
        ...tips,
      };
      return s;
    }
    case "mix": {
      const s: MixStep = {
        type: "mix",
        title: "Mix It Together",
        instruction: text,
        emoji: "🥄",
        targetTaps: seededRange(10, 17, seed),
        resultLabel: "Well Combined",
        ...tips,
      };
      return s;
    }
    case "pour": {
      const s: PourStep = {
        type: "pour",
        title: `Add the ${capitalize(subj)}`,
        instruction: text,
        emoji: emojiFor(subj),
        ingredient: subj,
        ingredientEmoji: emojiFor(subj),
        targetLevel: seededRange(40, 75, seed),
        ...tips,
      };
      return s;
    }
    case "crack": {
      const count = extractEggCount(text, recipe.ingredients);
      const s: CrackStep = {
        type: "crack",
        title: "Crack the Eggs",
        instruction: text,
        emoji: "🥚",
        count,
        ...tips,
      };
      return s;
    }
    case "temperature": {
      const t = extractTemp(text) ?? { temp: 180, unit: "°C" };
      const s: TemperatureStep = {
        type: "temperature",
        title: "Set the Temperature",
        instruction: text,
        emoji: "🌡️",
        targetTemp: t.temp,
        unit: t.unit,
        tolerance: t.unit === "°F" ? 20 : 10,
        ...tips,
      };
      return s;
    }
    case "timer": {
      const s: TimerStep = {
        type: "timer",
        title: "Cook & Watch",
        instruction: text,
        emoji: "⏱️",
        targetPercent: seededRange(58, 68, seed),
        ...tips,
      };
      return s;
    }
    case "saute": {
      const s: SauteStep = {
        type: "saute",
        title: `Sauté the ${capitalize(subj)}`,
        instruction: text,
        emoji: "🍳",
        ingredient: subj,
        targetStirs: seededRange(4, 6, seed),
        ...tips,
      };
      return s;
    }
    case "season": {
      const s: SeasonStep = {
        type: "season",
        title: "Season It",
        instruction: text,
        emoji: "🧂",
        spice: subj,
        spiceEmoji: "🧂",
        targetPinches: seededRange(3, 6, seed),
        ...tips,
      };
      return s;
    }
    case "simmer": {
      const s: SimmerStep = {
        type: "simmer",
        title: "Let It Simmer",
        instruction: text,
        emoji: "🫕",
        targetHeat: seededRange(42, 58, seed),
        ...tips,
      };
      return s;
    }
    case "action":
    default: {
      const s: ActionStep = {
        type: "action",
        title: "Next Step",
        instruction: text,
        emoji: "📋",
        actionLabel: "Got it!",
        ...tips,
      };
      return s;
    }
    case "drag": {
      const subject = extractSubject(text) || "ingredient";
      const isAdd = /\badd\b/i.test(text);
      const isServe = /\b(serve|plate|garnish)\b/i.test(text);
      const isRemove = /\b(remove|take\s+out|drain)\b/i.test(text);
      const s: DragStep = {
        type: "drag",
        title: isServe
          ? "Time to Plate!"
          : isRemove
            ? "Take It Out"
            : isAdd
              ? `Add the ${capitalize(subject)}`
              : "Move to Position",
        instruction: text,
        emoji: emojiFor(subject),
        itemEmoji: emojiFor(subject),
        targetLabel: isServe ? "Plate" : isRemove ? "Board" : /\b(pot|saucepan)\b/i.test(text) ? "Pot" : /\b(bowl)\b/i.test(text) ? "Bowl" : "Pan",
        ...tips,
      };
      return s;
    }
    case "select": {
      return createSelectStep(recipe.ingredients);
    }
  }
}

/* ─── deduplication & limiting ───────────────────────────────────── */

function deduplicateAndLimit(steps: SimStep[], maxSteps: number): SimStep[] {
  const result: SimStep[] = [];
  let consecutiveCount = 0;
  let lastType: string | null = null;

  for (const step of steps) {
    if (step.type === lastType) {
      consecutiveCount++;
      if (consecutiveCount >= 2) continue;
    } else {
      consecutiveCount = 0;
      lastType = step.type;
    }
    result.push(step);
  }

  if (result.length <= maxSteps) return result;

  const keep: SimStep[] = [];
  const stride = result.length / maxSteps;
  for (let i = 0; i < maxSteps; i++) {
    keep.push(result[Math.floor(i * stride)]);
  }
  const last = result[result.length - 1];
  if (keep[keep.length - 1] !== last) keep[keep.length - 1] = last;
  return keep;
}

/* ─── intro & completion generators ──────────────────────────────── */

const INTROS = [
  (t: string) => `Alright chef — today we're making ${t}! Let's walk through every step in the virtual kitchen so you're ready for the real thing. Apron on!`,
  (t: string) => `Time to master ${t}! Practice each step here first, then cook it for real with confidence. Let's go!`,
  (t: string) => `Welcome to the virtual kitchen, chef! We're tackling ${t} today. Practice makes perfect — show me what you've got!`,
];

const COMPLETIONS = [
  (t: string) => `Honk honk! You've mastered ${t} in the virtual kitchen! Now go make the real thing — you know exactly what to do. 🎉`,
  (t: string) => `Look at you, chef! ${t} — done and dusted! You've got the technique down. Time to cook it for real!`,
  (t: string) => `Brilliant work! You've walked through every step of ${t}. Your real-world version is going to be incredible! 🎂`,
];

/* ─── main generator ─────────────────────────────────────────────── */

export function generateSimulation(recipe: Recipe): RecipeSimulation {
  const title = recipe.title;
  const steps: SimStep[] = [];

  steps.push(createSetupStep());
  steps.push(createSelectStep(recipe.ingredients));

  const sentences = splitInstructions(recipe.instructions ?? "");

  if (sentences.length === 0) {
    steps.push({
      type: "action",
      title: "Follow the Recipe",
      instruction: `Follow the recipe steps to prepare ${title}.`,
      emoji: "📋",
      actionLabel: "Ready!",
      ...tipFor("action", title),
    } satisfies ActionStep);
  } else {
    const parsed: SimStep[] = [];
    for (let i = 0; i < sentences.length; i++) {
      const text = sentences[i];
      const type = classifyStep(text);
      parsed.push(buildStep(type, text, `${title}-${i}`, recipe));
    }
    steps.push(...deduplicateAndLimit(parsed, 8));
  }

  return {
    recipeKey: title.toLowerCase().trim(),
    intro: pick(INTROS, title)(title),
    steps,
    completion: pick(COMPLETIONS, title)(title),
  };
}

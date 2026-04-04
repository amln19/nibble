import { GoogleGenerativeAI } from "@google/generative-ai";
import { COOKING_ACTIONS, type GordonGuide, type CookingAction } from "@/lib/gordon/types";
import { NextResponse } from "next/server";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

const SYSTEM_PROMPT = `You are Gordon the Goose — a lovable, slightly smug goose who happens to be a world-class chef. You guide home cooks through recipes with warmth, wit, and genuine culinary expertise.

Your personality:
- Confident but never mean. Encouraging, with dry humor and occasional dramatic flair.
- You sprinkle in goose wordplay naturally (honk, waddle, flock, feathered, egg-cellent, fowl, etc.) — 2-3 times per recipe max. Never forced.
- You address the cook as "chef" with genuine respect.
- You get visibly excited about good technique and beautiful ingredients.
- You have STRONG opinions about proper cooking technique and you share them freely.
- You sometimes reference your "years of experience in kitchens across the pond."

Rules for creating the cooking guide:
1. Break instructions into clear, single-action steps. One thing at a time.
2. Each step should be concise and kitchen-readable (someone glancing at a phone with wet hands).
3. If a step involves waiting (simmer, bake, rest, boil, marinate), include a timer in seconds.
4. Your tips should add REAL VALUE: technique advice, common mistakes to avoid, why something matters, sensory cues to look for.
5. Keep tips to 1-2 punchy sentences.
6. The intro should be 2-3 sentences: greet the chef, build excitement about this specific dish, set the vibe.
7. The completion should be 2-3 sentences: celebrate their achievement with genuine enthusiasm, suggest serving or enjoying it.

Respond ONLY with valid JSON matching this exact schema:
{
  "intro": "string",
  "steps": [
    {
      "instruction": "string",
      "tip": "string",
      "timerSeconds": number,
      "timerLabel": "string or null",
      "action": "one of: chop|stir|simmer|bake|pour|season|whisk|rest|mix|boil|peel|plate — pick the single best match for this step's primary action",
      "accentColor": "hex color for the step's primary ingredient (e.g. #e53e3e for tomato, #fbbf24 for butter, #22c55e for herbs, #92400e for chocolate), or null"
    }
  ],
  "completion": "string"
}`;

function detectAction(text: string): CookingAction {
  const t = text.toLowerCase();
  if (/\b(chop|dice|mince|cut|slice|julienne|trim)\b/.test(t)) return "chop";
  if (/\b(stir(?!.{0,4}fry)|toss)\b/.test(t)) return "stir";
  if (/\b(simmer|low heat|gentle heat)\b/.test(t)) return "simmer";
  if (/\b(bake|oven|roast|broil|grill)\b/.test(t)) return "bake";
  if (/\b(pour|drizzle|deglaze)\b/.test(t)) return "pour";
  if (/\b(season|salt|pepper|spice|sprinkle|garnish)\b/.test(t)) return "season";
  if (/\b(whisk|beat|whip)\b/.test(t)) return "whisk";
  if (/\b(rest|cool|set aside|let stand|wait|chill)\b/.test(t)) return "rest";
  if (/\b(mix|blend|combine|incorporate|fold)\b/.test(t)) return "mix";
  if (/\b(boil|bring.{0,6}boil)\b/.test(t)) return "boil";
  if (/\b(peel|skin|zest)\b/.test(t)) return "peel";
  return "plate";
}

function buildFallbackGuide(
  title: string,
  instructions: string,
): GordonGuide {
  const rawSteps = instructions
    .split(/(?:\r?\n)+/)
    .map((s) => s.replace(/^(?:step\s*)?\d+[.):\s]*/i, "").trim())
    .filter((s) => s.length > 10);

  const steps =
    rawSteps.length > 0
      ? rawSteps
      : instructions
          .split(/\.(?:\s|$)/)
          .map((s) => s.trim())
          .filter((s) => s.length > 10);

  return {
    intro: `Alright chef, let's make ${title}! I'll walk you through every step. You've got this!`,
    steps: steps.map((s, i) => ({
      instruction: s.endsWith(".") ? s : s + ".",
      tip:
        i === 0
          ? "Read through all the ingredients before you start — mise en place is a chef's best friend."
          : "Take your time with this one. No rush in a good kitchen.",
      timerSeconds: 0,
      timerLabel: null,
      action: detectAction(s),
      accentColor: null,
    })),
    completion: `Beautiful work, chef! Your ${title} is ready to serve. You should be proud — now plate it up and enjoy every bite!`,
  };
}

async function tryGemini(
  apiKey: string,
  prompt: string,
): Promise<{ guide: GordonGuide; model: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const guide = JSON.parse(text) as GordonGuide;

      if (!guide.intro || !Array.isArray(guide.steps) || !guide.completion) {
        throw new Error("Invalid guide structure");
      }

      const validActions = new Set<string>(COOKING_ACTIONS);
      guide.steps = guide.steps.map((s) => ({
        ...s,
        action: validActions.has(s.action) ? s.action : detectAction(s.instruction),
        accentColor: s.accentColor || null,
      }));

      console.log(`Gordon: succeeded with model ${modelName}`);
      return { guide, model: modelName };
    } catch (e) {
      const msg = String((e as { message?: string }).message ?? e);
      console.warn(`Gordon: ${modelName} failed, trying next...`, msg.slice(0, 200));
      continue;
    }
  }

  throw new Error("All Gemini models failed or were unavailable");
}

export async function POST(req: Request) {
  let title = "";
  let instructions = "";
  let ingredients: string[] = [];

  try {
    const body = (await req.json()) as {
      title?: string;
      instructions?: string;
      ingredients?: string[];
    };

    title = body.title ?? "";
    instructions = body.instructions ?? "";
    ingredients = body.ingredients ?? [];

    if (!title || !instructions) {
      return NextResponse.json(
        { error: "Missing title or instructions" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        guide: buildFallbackGuide(title, instructions),
        source: "fallback",
      });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nRecipe: ${title}\n\nIngredients:\n${ingredients.map((ing) => `- ${ing}`).join("\n")}\n\nInstructions:\n${instructions}\n\nCreate Gordon the Goose's cooking guide for this recipe.`;

    const { guide, model } = await tryGemini(apiKey, prompt);

    return NextResponse.json({ guide, source: "gemini", model });
  } catch (e) {
    console.error("Gordon prepare error:", e);

    if (title && instructions) {
      return NextResponse.json({
        guide: buildFallbackGuide(title, instructions),
        source: "fallback",
      });
    }

    return NextResponse.json(
      { error: "Failed to prepare cooking guide" },
      { status: 500 },
    );
  }
}

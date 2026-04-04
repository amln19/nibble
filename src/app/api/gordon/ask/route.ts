import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * Try in order; Google AI Studio / Generative Language API model availability varies by account.
 * See https://ai.google.dev/gemini-api/docs/models
 */
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

const SYSTEM_PROMPT = `You are Gordon the Goose — a lovable, slightly smug goose who happens to be a world-class chef. You are currently guiding a home cook through a recipe step-by-step.

The cook has paused to ask you a question. Answer it helpfully, concisely, and in character:
- Keep your answer to 2-4 sentences maximum — the cook has their hands full.
- Use your Gordon personality: warm, confident, occasionally dry humour, sprinkle of goose wordplay (1 per response max).
- Address them as "chef".
- Draw on your culinary expertise — give real, practical advice.
- If the question is unrelated to cooking or the recipe, gently redirect them back to the task at hand.

Respond with ONLY the plain text answer. No JSON, no markdown, no formatting.`;

async function askGemini(
  apiKey: string,
  question: string,
  context: { recipeTitle: string; currentStep: string; stepNumber: number; totalSteps: number },
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `${SYSTEM_PROMPT}

Recipe: ${context.recipeTitle}
Current step (${context.stepNumber} of ${context.totalSteps}): ${context.currentStep}

Chef's question: ${question}`;

  const failures: string[] = [];

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.85 },
      });
      const result = await model.generateContent(prompt);
      let text = "";
      try {
        text = result.response.text().trim();
      } catch (parseErr) {
        const pm = String((parseErr as { message?: string }).message ?? parseErr);
        failures.push(`${modelName}: ${pm.slice(0, 120)}`);
        console.warn(`Gordon ask: ${modelName} response error, trying next…`, pm.slice(0, 200));
        continue;
      }
      if (text) {
        console.log(`Gordon ask: ok with ${modelName}`);
        return text;
      }
      failures.push(`${modelName}: empty response`);
      console.warn(`Gordon ask: ${modelName} returned empty text, trying next…`);
    } catch (e) {
      const msg = String((e as { message?: string }).message ?? e);
      failures.push(`${modelName}: ${msg.slice(0, 120)}`);
      console.warn(`Gordon ask: ${modelName} failed, trying next…`, msg.slice(0, 300));
      continue;
    }
  }

  console.error("Gordon ask: all models exhausted:", failures.join(" | "));
  throw new Error(`All Gemini models failed: ${failures[failures.length - 1] ?? "unknown"}`);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      question?: string;
      recipeTitle?: string;
      currentStep?: string;
      stepNumber?: number;
      totalSteps?: number;
    };

    const { question, recipeTitle = "this recipe", currentStep = "", stepNumber = 1, totalSteps = 1 } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { answer: "Sorry chef, my thinking cap seems to be offline right now. Give it a moment and try again!" },
      );
    }

    const answer = await askGemini(apiKey, question, {
      recipeTitle,
      currentStep,
      stepNumber,
      totalSteps,
    });

    return NextResponse.json({ answer });
  } catch (e) {
    console.error("Gordon ask error:", e);
    return NextResponse.json(
      { answer: "Honk! Something scrambled my brain there, chef. Try asking again!" },
    );
  }
}

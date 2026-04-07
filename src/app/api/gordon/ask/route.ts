import { type GenerateContentResponse, VertexAI } from "@google-cloud/vertexai";
import { getGordonModelOrder } from "@/lib/gordon/model-selection";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Gordon the Goose — a lovable, slightly smug goose who happens to be a world-class chef. You are currently guiding a home cook through a recipe step-by-step.

The cook has paused to ask you a question. Answer it helpfully, concisely, and in character:
- Keep your answer to 2-4 sentences maximum — the cook has their hands full.
- Use your Gordon personality: warm, confident, occasionally dry humour, sprinkle of goose wordplay (1 per response max).
- Address them as "chef".
- Draw on your culinary expertise — give real, practical advice.
- If the question is unrelated to cooking or the recipe, gently redirect them back to the task at hand.
- If you mention temperatures or units, prefer easy-to-say forms (for example "350 degrees Fahrenheit" over shorthand like "350F").

Respond with ONLY the plain text answer. No JSON, no markdown, no formatting.`;

function extractText(response: GenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) =>
      "text" in part && typeof part.text === "string" ? part.text : "",
    )
    .join("")
    .trim();
}

async function askVertexGemini(
  vertexAI: VertexAI,
  modelNames: string[],
  question: string,
  context: {
    recipeTitle: string;
    currentStep: string;
    stepNumber: number;
    totalSteps: number;
  },
): Promise<{ answer: string; model: string }> {
  const prompt = `Recipe: ${context.recipeTitle}
Current step (${context.stepNumber} of ${context.totalSteps}): ${context.currentStep}

Chef's question: ${question}`;

  const failures: string[] = [];

  for (const modelName of modelNames) {
    try {
      const model = vertexAI.preview.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 220,
        },
      });
      const result = await model.generateContent(prompt);
      const text = extractText(result.response);
      if (text) {
        console.log(`Gordon ask: ok with ${modelName}`);
        return { answer: text, model: modelName };
      }
      failures.push(`${modelName}: empty response`);
      console.warn(
        `Gordon ask: ${modelName} returned empty text, trying next…`,
      );
    } catch (e) {
      const msg = String((e as { message?: string }).message ?? e);
      failures.push(`${modelName}: ${msg.slice(0, 120)}`);
      console.warn(
        `Gordon ask: ${modelName} failed, trying next…`,
        msg.slice(0, 300),
      );
      continue;
    }
  }

  console.error("Gordon ask: all models exhausted:", failures.join(" | "));
  throw new Error(
    `All Vertex Gemini models failed: ${failures[failures.length - 1] ?? "unknown"}`,
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`gordon:ask:${user.id}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many ask requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const body = (await req.json()) as {
      question?: string;
      recipeTitle?: string;
      currentStep?: string;
      stepNumber?: number;
      totalSteps?: number;
    };

    const {
      question,
      recipeTitle = "this recipe",
      currentStep = "",
      stepNumber = 1,
      totalSteps = 1,
    } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }
    if (question.trim().length > 500) {
      return NextResponse.json(
        { error: "Question is too long" },
        { status: 400 },
      );
    }

    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
    if (!project) {
      return NextResponse.json({
        answer:
          "Sorry chef, my thinking cap seems to be offline right now. Give it a moment and try again!",
        source: "fallback",
        model: null,
      });
    }

    const vertexAI = new VertexAI({ project, location });
    const modelNames = getGordonModelOrder("ask");

    const { answer, model } = await askVertexGemini(
      vertexAI,
      modelNames,
      question,
      {
        recipeTitle,
        currentStep,
        stepNumber,
        totalSteps,
      },
    );

    return NextResponse.json({ answer, source: "vertex", model });
  } catch (e) {
    console.error("Gordon ask error:", e);
    return NextResponse.json({
      answer:
        "Honk! Something scrambled my brain there, chef. Try asking again!",
      source: "fallback",
      model: null,
    });
  }
}

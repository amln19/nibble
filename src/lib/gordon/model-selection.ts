export type GordonTask = "ask" | "prepare";

const DEFAULT_MODELS: Record<GordonTask, string[]> = {
  // Ask is short-form chat: prioritize low cost and latency, then quality fallback.
  ask: ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite"],
  // Prepare needs structured JSON + stronger instruction following.
  prepare: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
};

function parseCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function getGordonModelOrder(task: GordonTask): string[] {
  const taskKey = task.toUpperCase();

  const configured = unique([
    ...parseCsv(process.env[`GORDON_GEMINI_${taskKey}_MODEL`]),
    ...parseCsv(process.env[`GORDON_GEMINI_${taskKey}_FALLBACKS`]),
    ...parseCsv(process.env.GORDON_GEMINI_MODEL),
    ...parseCsv(process.env.GORDON_GEMINI_FALLBACKS),
  ]);

  return configured.length > 0 ? configured : DEFAULT_MODELS[task];
}

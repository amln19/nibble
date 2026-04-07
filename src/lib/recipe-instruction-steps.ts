/**
 * Split API-style instruction text into discrete steps for UI (TheMealDB etc.).
 */
export function parseInstructionSteps(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const stripLead = (s: string) =>
    s
      .trim()
      // "step 1 Heat…", "Step 2: Meanwhile…" (UI already shows step numbers)
      .replace(/^step\s*\d+\s*[.:)\u2013\u2014-]?\s*/i, "")
      .replace(/^(?:step\s*)?\d+[.)]\s*/i, "")
      .replace(/^[-•*]\s+/, "")
      .trim();

  let blocks = text
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (blocks.length === 1 && blocks[0].includes("\n")) {
    const lines = blocks[0]
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length > 1) blocks = lines;
  }

  let steps = blocks.map(stripLead).filter((s) => s.length > 0);

  const blob = steps.join(" ");
  const shouldSentenceSplit =
    steps.length <= 2 &&
    blob.length > 280 &&
    steps.some((s) => s.length > 120);

  if (shouldSentenceSplit) {
    const sentences = blob
      .split(/(?<=[.!?…])\s+(?=[A-Z0-9"(])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 14);
    if (sentences.length >= 2) steps = sentences;
  }

  return steps.map(stripLead).filter((s) => s.length > 0);
}

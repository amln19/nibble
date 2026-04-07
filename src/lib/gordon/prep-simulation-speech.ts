import type { Recipe } from "@/lib/recipes";
import type { RecipeSimulation, SimStep, StepResult } from "./simulation-types";

const MAX_LEN = 980;

function clip(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= MAX_LEN) return t;
  return `${t.slice(0, MAX_LEN - 1).trim()}…`;
}

function typeCoaching(type: SimStep["type"]): string {
  switch (type) {
    case "drag":
      return "Drag the right ingredient to the matching zone.";
    case "select":
      return "Tap every ingredient that belongs in this step.";
    case "pour":
      return "Pour until you hit the target fill line.";
    case "mix":
      return "Mix with steady taps until the meter is happy.";
    case "crack":
      return "Crack each egg with good timing.";
    case "temperature":
      return "Dial the oven to the target temperature.";
    case "timer":
      return "Stop the timer when the bar matches the sweet spot.";
    case "chop":
      return "Chop with a steady rhythm.";
    case "saute":
      return "Keep stirring until the food is evenly cooked.";
    case "season":
      return "Add pinches until you reach the seasoning goal.";
    case "simmer":
      return "Hold the heat in the green simmer zone.";
    case "action":
      return "Follow the quick on-screen action.";
    default:
      return "";
  }
}

/** Intro screen: recipe overview + Gordon's intro (practice framing). */
export function prepSimulationIntroSpeech(
  recipe: Recipe,
  simulation: RecipeSimulation,
): string {
  return clip(
    `Practice mode for ${recipe.title}. You will run through ${simulation.steps.length} short kitchen challenges — no real ingredients, just muscle memory. ${simulation.intro}`,
  );
}

/** When a new step appears — title, task, and one-line coaching for the mini-game. */
export function prepSimulationStepSpeech(
  stepIndex: number,
  totalSteps: number,
  step: SimStep,
): string {
  const n = stepIndex + 1;
  const coach = typeCoaching(step.type);
  return clip(
    `Step ${n} of ${totalSteps}: ${step.title}. ${step.instruction}${coach ? ` ${coach}` : ""}`,
  );
}

/** Short line after a round — result + Gordon tip. */
export function prepSimulationFeedbackSpeech(
  result: StepResult,
  step: SimStep,
): string {
  const praise = result.perfect
    ? "Nice work."
    : "Good effort — keep going.";
  const tip = result.perfect ? step.tip : step.mistakeTip;
  return clip(`${praise} ${result.message} ${tip}`);
}

/** Wrap-up + encouragement toward real cooking. */
export function prepSimulationCompleteSpeech(
  recipe: Recipe,
  simulation: RecipeSimulation,
  perfectCount: number,
  totalSteps: number,
): string {
  const score =
    perfectCount === totalSteps
      ? "You aced every challenge."
      : `You nailed ${perfectCount} out of ${totalSteps} runs perfectly.`;
  return clip(`${score} ${simulation.completion} When you are ready, try cooking this for real with Gordon in live mode.`);
}

export const COOKING_ACTIONS = [
  "chop", "stir", "simmer", "bake", "pour", "season",
  "whisk", "rest", "mix", "boil", "peel", "plate",
] as const;

export type CookingAction = (typeof COOKING_ACTIONS)[number];

export type GordonStep = {
  instruction: string;
  tip: string;
  timerSeconds: number;
  timerLabel: string | null;
  action: CookingAction;
  accentColor: string | null;
};

export type GordonGuide = {
  intro: string;
  steps: GordonStep[];
  completion: string;
};

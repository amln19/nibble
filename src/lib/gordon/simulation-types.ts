type BaseStep = {
  title: string;
  instruction: string;
  emoji: string;
  tip: string;
  mistakeTip: string;
};

export type DragStep = BaseStep & {
  type: "drag";
  itemEmoji: string;
  targetLabel: string;
};

export type SelectStep = BaseStep & {
  type: "select";
  correct: { name: string; emoji: string }[];
  distractors: { name: string; emoji: string }[];
};

export type PourStep = BaseStep & {
  type: "pour";
  ingredient: string;
  ingredientEmoji: string;
  targetLevel: number;
};

export type MixStep = BaseStep & {
  type: "mix";
  targetTaps: number;
  resultLabel: string;
};

export type CrackStep = BaseStep & {
  type: "crack";
  count: number;
};

export type TemperatureStep = BaseStep & {
  type: "temperature";
  targetTemp: number;
  unit: string;
  tolerance: number;
};

export type TimerStep = BaseStep & {
  type: "timer";
  targetPercent: number;
};

export type ChopStep = BaseStep & {
  type: "chop";
  ingredient: string;
  targetChops: number;
};

export type SauteStep = BaseStep & {
  type: "saute";
  ingredient: string;
  targetStirs: number;
};

export type SeasonStep = BaseStep & {
  type: "season";
  spice: string;
  spiceEmoji: string;
  targetPinches: number;
};

export type SimmerStep = BaseStep & {
  type: "simmer";
  targetHeat: number;
};

export type ActionStep = BaseStep & {
  type: "action";
  actionLabel: string;
};

export type SimStep =
  | DragStep
  | SelectStep
  | PourStep
  | MixStep
  | CrackStep
  | TemperatureStep
  | TimerStep
  | ChopStep
  | SauteStep
  | SeasonStep
  | SimmerStep
  | ActionStep;

export type StepResult = {
  perfect: boolean;
  message: string;
};

export type RecipeSimulation = {
  recipeKey: string;
  intro: string;
  steps: SimStep[];
  completion: string;
};

import type { RecipeSimulation } from "../simulation-types";

export const madeiraCakeSim: RecipeSimulation = {
  recipeKey: "madeira cake",
  intro:
    "Right then, chef — we're baking a proper Madeira Cake today! Let's walk through every step in the virtual kitchen first, so when you do it for real, it'll be an egg-cellent experience. Apron on, let's go!",
  steps: [
    {
      type: "drag",
      title: "Set Up Your Workspace",
      instruction: "Drag the mixing bowl onto the counter",
      emoji: "🥣",
      itemEmoji: "🥣",
      targetLabel: "Counter",
      tip: "A clean, organized workspace is a chef's secret weapon. Always clear the counter before you start — mise en place!",
      mistakeTip:
        "Keep trying! A messy kitchen slows you down. Everything in its place, chef.",
    },
    {
      type: "select",
      title: "Gather Your Ingredients",
      instruction: "Find all 7 ingredients for Madeira Cake",
      emoji: "🧺",
      correct: [
        { name: "Butter", emoji: "🧈" },
        { name: "Caster Sugar", emoji: "🍬" },
        { name: "Eggs", emoji: "🥚" },
        { name: "Self-Raising Flour", emoji: "🌾" },
        { name: "Plain Flour", emoji: "🫗" },
        { name: "Lemon", emoji: "🍋" },
        { name: "Milk", emoji: "🥛" },
      ],
      distractors: [
        { name: "Chocolate", emoji: "🍫" },
        { name: "Cheese", emoji: "🧀" },
        { name: "Tomato", emoji: "🍅" },
        { name: "Rice", emoji: "🍚" },
        { name: "Olive Oil", emoji: "🫒" },
        { name: "Soy Sauce", emoji: "🥫" },
        { name: "Honey", emoji: "🍯" },
      ],
      tip: "Mise en place! Having everything ready before you start is the foundation of stress-free cooking.",
      mistakeTip:
        "That's not in the recipe! Read carefully — one wrong ingredient can change the whole dish.",
    },
    {
      type: "temperature",
      title: "Preheat the Oven",
      instruction: "Set the oven to 160°C",
      emoji: "🌡️",
      targetTemp: 160,
      unit: "°C",
      tolerance: 10,
      tip: "Always preheat! A cold oven means uneven baking — the cake needs consistent heat from the very start.",
      mistakeTip:
        "Wrong temperature! Too hot burns the outside before the inside sets. Too cold and the cake won't rise.",
    },
    {
      type: "mix",
      title: "Cream Butter & Sugar",
      instruction: "Beat until light and fluffy!",
      emoji: "🧈",
      targetTaps: 15,
      resultLabel: "Light & Fluffy",
      tip: "Creaming traps air bubbles in the fat — that's what makes your cake rise and taste tender. Beat 3-5 minutes in real life!",
      mistakeTip:
        "Under-creaming gives you a dense, heavy cake. Keep going until the mixture is pale and fluffy!",
    },
    {
      type: "crack",
      title: "Add the Eggs",
      instruction: "Crack 3 eggs into the mixture",
      emoji: "🥚",
      count: 3,
      tip: "Adding eggs one at a time helps them emulsify smoothly. If it curdles, a spoonful of flour fixes it!",
      mistakeTip:
        "Careful! Crack gently on a flat surface, not the bowl edge — that pushes shell fragments in.",
    },
    {
      type: "pour",
      title: "Fold in the Flour",
      instruction: "Gently add flour — don't overmix!",
      emoji: "🌾",
      ingredient: "Flour",
      ingredientEmoji: "🌾",
      targetLevel: 72,
      tip: "Fold, don't stir! Overmixing develops gluten, which makes your cake tough instead of tender.",
      mistakeTip:
        "Too much flour makes it dry and dense. Too little and it won't hold together. Measure precisely!",
    },
    {
      type: "pour",
      title: "Add Lemon Zest & Milk",
      instruction: "A splash of milk and bright lemon zest",
      emoji: "🍋",
      ingredient: "Milk & Lemon",
      ingredientEmoji: "🍋",
      targetLevel: 40,
      tip: "Lemon zest adds brightness without sourness. Only zest the yellow part — the white pith is bitter!",
      mistakeTip: "Too much liquid makes a soggy cake. Just a splash is all you need!",
    },
    {
      type: "drag",
      title: "Pour Into the Tin",
      instruction: "Transfer the batter to the loaf tin",
      emoji: "🍞",
      itemEmoji: "🥣",
      targetLabel: "Loaf Tin",
      tip: "Smooth the top with a spatula for an even bake. A slight dip in the center prevents doming!",
      mistakeTip:
        "Careful not to spill! Hold the bowl steady and pour in a controlled stream.",
    },
    {
      type: "timer",
      title: "Bake the Cake!",
      instruction: "Watch through the oven window — pull it out when golden!",
      emoji: "🎂",
      targetPercent: 62,
      tip: "A skewer in the center should come out clean. If it's wet, give it 5 more minutes!",
      mistakeTip:
        "Don't open the oven too early — it lets heat escape and can make the cake sink. Wait at least 45 minutes!",
    },
  ],
  completion:
    "LOOK at that beautiful Madeira Cake! Golden crust, moist interior, and that hint of lemon — absolutely divine, chef. I'm genuinely impressed with your virtual kitchen skills. Now go make the real thing — you've already done it once! Honk honk! 🎉",
};

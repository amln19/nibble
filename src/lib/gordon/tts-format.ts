function expandTemperatureUnit(unit: string): string {
  return unit.toLowerCase() === "f" ? "Fahrenheit" : "Celsius";
}

const FRACTIONS: Array<[RegExp, string]> = [
  [/\b1\/2\b/g, "one half"],
  [/\b1\/3\b/g, "one third"],
  [/\b2\/3\b/g, "two thirds"],
  [/\b1\/4\b/g, "one quarter"],
  [/\b3\/4\b/g, "three quarters"],
  [/\b1\/8\b/g, "one eighth"],
  [/\b3\/8\b/g, "three eighths"],
  [/\b5\/8\b/g, "five eighths"],
  [/\b7\/8\b/g, "seven eighths"],
];

const SIMPLE_UNITS: Array<[RegExp, string]> = [
  [/\btsp\.?\b/gi, "teaspoon"],
  [/\btbsp\.?\b/gi, "tablespoon"],
  [/\boz\.?\b/gi, "ounces"],
  [/\blbs?\.?\b/gi, "pounds"],
  [/\bmins?\.?\b/gi, "minutes"],
  [/\bsecs?\.?\b/gi, "seconds"],
];

export function normalizeForTts(input: string): string {
  let text = input;

  text = text.replace(/½/g, " one half ");
  text = text.replace(/¼/g, " one quarter ");
  text = text.replace(/¾/g, " three quarters ");

  text = text.replace(
    /\b(\d+)\s*-\s*(\d+)\s*(?:°\s*)?([FC])\b/gi,
    (_, a: string, b: string, unit: string) => {
      return `${a} to ${b} degrees ${expandTemperatureUnit(unit)}`;
    },
  );

  text = text.replace(
    /\b(\d+)\s*(?:°\s*)?([FC])\b/gi,
    (_, value: string, unit: string) => {
      return `${value} degrees ${expandTemperatureUnit(unit)}`;
    },
  );

  text = text.replace(/\b(\d+(?:\.\d+)?)\s*kg\b/gi, "$1 kilograms");
  text = text.replace(/\b(\d+(?:\.\d+)?)\s*g\b/gi, "$1 grams");
  text = text.replace(/\b(\d+(?:\.\d+)?)\s*ml\b/gi, "$1 milliliters");
  text = text.replace(/\b(\d+(?:\.\d+)?)\s*l\b/gi, "$1 liters");

  text = text.replace(
    /\b(\d{1,2}):([0-5]\d)\b/g,
    (_, mins: string, secs: string) => {
      return `${Number(mins)} minutes ${Number(secs)} seconds`;
    },
  );

  for (const [pattern, replacement] of FRACTIONS) {
    text = text.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of SIMPLE_UNITS) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\b(\d+)\s*%\b/g, "$1 percent");
  text = text.replace(/&/g, " and ");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

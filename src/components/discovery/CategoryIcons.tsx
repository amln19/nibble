/**
 * Flat cartoon illustrated SVG icons — warm palette, thick outlines,
 * highlights + shadows. One per MealDB category.
 */
"use client";
import type { ReactElement } from "react";
import { useState } from "react";

const S = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/* ─── BEEF ─────────────────────────────────────────────────────────────── */
function BeefIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* fat cap */}
      <path d="M10 42 C8 28 16 14 30 12 C44 10 58 20 60 34 C62 48 52 58 38 58 C24 58 12 54 10 42Z" fill="#f5d0b8" stroke="#7a3a18" strokeWidth="2.5" {...S}/>
      {/* meat */}
      <path d="M14 42 C12 30 20 18 32 16 C46 14 56 22 57 34 C58 46 50 54 38 55 C26 55 16 52 14 42Z" fill="#d4533a" stroke="#7a3a18" strokeWidth="2" {...S}/>
      {/* highlight sheen */}
      <path d="M20 22 C28 15 40 16 48 24" stroke="#e8836a" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* grill marks */}
      <line x1="29" y1="26" x2="25" y2="48" stroke="#9a2a10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="38" y1="24" x2="34" y2="50" stroke="#9a2a10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="47" y1="28" x2="43" y2="50" stroke="#9a2a10" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── BREAKFAST ─────────────────────────────────────────────────────────── */
function BreakfastIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* bowl shadow */}
      <ellipse cx="36" cy="62" rx="22" ry="5" fill="#d4a860" opacity="0.4"/>
      {/* bowl body */}
      <path d="M12 36 Q12 62 36 62 Q60 62 60 36 Z" fill="#c98440" stroke="#7a4a18" strokeWidth="2.5" {...S}/>
      {/* bowl rim */}
      <ellipse cx="36" cy="36" rx="24" ry="8" fill="#e8a860" stroke="#7a4a18" strokeWidth="2.5"/>
      {/* milk surface */}
      <ellipse cx="36" cy="36" rx="20" ry="6" fill="#fff8f0"/>
      {/* cereal rings */}
      <ellipse cx="26" cy="34" rx="4" ry="2.5" fill="none" stroke="#e53935" strokeWidth="2.5"/>
      <ellipse cx="36" cy="32" rx="4" ry="2.5" fill="none" stroke="#1e88e5" strokeWidth="2.5"/>
      <ellipse cx="46" cy="34" rx="4" ry="2.5" fill="none" stroke="#f9a825" strokeWidth="2.5"/>
      <ellipse cx="30" cy="38" rx="4" ry="2.5" fill="none" stroke="#43a047" strokeWidth="2.5"/>
      <ellipse cx="42" cy="38" rx="4" ry="2.5" fill="none" stroke="#e91e63" strokeWidth="2.5"/>
      {/* spoon */}
      <line x1="54" y1="18" x2="48" y2="40" stroke="#c98440" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="56" cy="16" rx="5" ry="7" fill="#e8a860" stroke="#7a4a18" strokeWidth="2" transform="rotate(-20 56 16)"/>
    </svg>
  );
}

/* ─── CHICKEN ───────────────────────────────────────────────────────────── */
function ChickenIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow */}
      <ellipse cx="36" cy="66" rx="18" ry="4" fill="#c07010" opacity="0.3"/>
      {/* meat body */}
      <path d="M18 56 C6 48 6 28 18 18 C26 10 44 10 52 22 C60 34 56 56 44 60 C36 64 26 62 18 56Z" fill="#d4820e" stroke="#7a4010" strokeWidth="2.5" {...S}/>
      {/* highlight */}
      <path d="M20 22 C28 12 42 12 50 22" stroke="#f5b940" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      {/* shadow side */}
      <path d="M14 48 C8 38 10 26 18 20" stroke="#9a5808" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6"/>
      {/* bone */}
      <rect x="32" y="6" width="8" height="22" rx="4" fill="#fff8f0" stroke="#b08040" strokeWidth="2"/>
      {/* bone knobs */}
      <circle cx="36" cy="7" r="7" fill="#fff8f0" stroke="#b08040" strokeWidth="2"/>
      <circle cx="36" cy="27" r="7" fill="#fff8f0" stroke="#b08040" strokeWidth="2"/>
      {/* crisp specks */}
      <circle cx="24" cy="44" r="4" fill="#a05808" opacity="0.5"/>
      <circle cx="36" cy="40" r="3.5" fill="#a05808" opacity="0.5"/>
      <circle cx="46" cy="48" r="4" fill="#a05808" opacity="0.5"/>
    </svg>
  );
}

/* ─── DESSERT ───────────────────────────────────────────────────────────── */
function DessertIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* plate */}
      <ellipse cx="36" cy="64" rx="26" ry="5" fill="#e8e0d0" stroke="#c0b090" strokeWidth="1.5"/>
      {/* cake sponge bottom */}
      <rect x="14" y="46" width="44" height="18" rx="3" fill="#f5d060" stroke="#a07820" strokeWidth="2"/>
      {/* cream filling */}
      <rect x="14" y="42" width="44" height="6" fill="#fff8f0" stroke="#d0c0a0" strokeWidth="1"/>
      {/* sponge top */}
      <rect x="14" y="28" width="44" height="14" rx="3" fill="#f5d060" stroke="#a07820" strokeWidth="2"/>
      {/* frosting top */}
      <path d="M14 28 Q20 20 36 24 Q52 20 58 28" fill="#fff8f0" stroke="#d0c0a0" strokeWidth="1.5" {...S}/>
      {/* frosting blobs */}
      <circle cx="24" cy="26" r="5" fill="#fff8f0" stroke="#d0c0a0" strokeWidth="1.5"/>
      <circle cx="36" cy="23" r="5" fill="#fff8f0" stroke="#d0c0a0" strokeWidth="1.5"/>
      <circle cx="48" cy="26" r="5" fill="#fff8f0" stroke="#d0c0a0" strokeWidth="1.5"/>
      {/* strawberry left */}
      <path d="M26 20 C22 14 22 8 26 6 C30 4 34 8 32 14 Z" fill="#e53935" stroke="#c0201e" strokeWidth="1.5"/>
      <path d="M26 6 Q28 2 30 4" stroke="#43a047" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* strawberry right */}
      <path d="M40 18 C36 12 36 6 40 4 C44 2 48 6 46 12 Z" fill="#e53935" stroke="#c0201e" strokeWidth="1.5"/>
      <path d="M40 4 Q42 0 44 2" stroke="#43a047" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* ─── GOAT ──────────────────────────────────────────────────────────────── */
function GoatIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* cheese wheel body */}
      <rect x="10" y="22" width="52" height="32" rx="5" fill="#ffc107" stroke="#8a6000" strokeWidth="2.5"/>
      {/* top face */}
      <ellipse cx="36" cy="22" rx="26" ry="8" fill="#ffd54f" stroke="#8a6000" strokeWidth="2.5"/>
      {/* bottom face */}
      <ellipse cx="36" cy="54" rx="26" ry="8" fill="#e0a800" stroke="#8a6000" strokeWidth="2.5"/>
      {/* rind stripe */}
      <rect x="10" y="28" width="52" height="5" fill="#f9a825" opacity="0.5"/>
      <rect x="10" y="43" width="52" height="5" fill="#f9a825" opacity="0.5"/>
      {/* holes */}
      <ellipse cx="24" cy="38" rx="5.5" ry="4" fill="#e0a800" stroke="#8a6000" strokeWidth="1.5"/>
      <ellipse cx="38" cy="33" rx="4.5" ry="3.5" fill="#e0a800" stroke="#8a6000" strokeWidth="1.5"/>
      <ellipse cx="48" cy="42" rx="4.5" ry="3.5" fill="#e0a800" stroke="#8a6000" strokeWidth="1.5"/>
      {/* highlight */}
      <path d="M14 26 Q28 18 48 24" stroke="#fff9c4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7"/>
    </svg>
  );
}

/* ─── LAMB ──────────────────────────────────────────────────────────────── */
function LambIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow */}
      <ellipse cx="36" cy="66" rx="24" ry="4" fill="#a03020" opacity="0.25"/>
      {/* meat (large chop) */}
      <path d="M10 30 C8 18 16 8 28 8 C42 8 52 16 54 30 C56 46 46 60 32 60 C18 60 12 44 10 30Z" fill="#d4533a" stroke="#7a1808" strokeWidth="2.5" {...S}/>
      {/* fat cap */}
      <path d="M10 28 C8 16 18 6 28 6 C40 6 52 14 54 26" fill="#f5cdb0" stroke="#c09070" strokeWidth="2" {...S}/>
      {/* highlight */}
      <path d="M16 18 C22 10 34 10 44 18" stroke="#e8836a" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* bone handle */}
      <rect x="44" y="6" width="10" height="32" rx="5" fill="#fff8f0" stroke="#b09070" strokeWidth="2"/>
      {/* bone knobs */}
      <circle cx="49" cy="7" r="8" fill="#fff8f0" stroke="#b09070" strokeWidth="2"/>
      <circle cx="49" cy="37" r="8" fill="#fff8f0" stroke="#b09070" strokeWidth="2"/>
    </svg>
  );
}

/* ─── MISCELLANEOUS ─────────────────────────────────────────────────────── */
function MiscIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow */}
      <ellipse cx="36" cy="66" rx="22" ry="4" fill="#8a5020" opacity="0.25"/>
      {/* bowl */}
      <path d="M12 36 Q12 62 36 62 Q60 62 60 36 Z" fill="#e8c890" stroke="#8a5020" strokeWidth="2.5" {...S}/>
      {/* rim */}
      <ellipse cx="36" cy="36" rx="24" ry="8" fill="#d4a860" stroke="#8a5020" strokeWidth="2.5"/>
      {/* noodles / food pile */}
      <path d="M20 36 Q22 28 30 30 Q36 24 42 30 Q50 28 52 36" stroke="#e8c040" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <path d="M22 36 Q26 30 32 32 Q38 28 44 34" stroke="#d4a020" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* toppings */}
      <circle cx="28" cy="32" r="4.5" fill="#e53935" opacity="0.9"/>
      <circle cx="36" cy="28" r="4" fill="#43a047" opacity="0.9"/>
      <circle cx="44" cy="32" r="4.5" fill="#f9a825" opacity="0.9"/>
      {/* fork */}
      <line x1="16" y1="14" x2="16" y2="36" stroke="#8a5020" strokeWidth="3" strokeLinecap="round"/>
      <line x1="13" y1="14" x2="13" y2="24" stroke="#8a5020" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="14" x2="16" y2="24" stroke="#8a5020" strokeWidth="2" strokeLinecap="round"/>
      <line x1="19" y1="14" x2="19" y2="24" stroke="#8a5020" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── PASTA ─────────────────────────────────────────────────────────────── */
function PastaIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow */}
      <ellipse cx="36" cy="66" rx="22" ry="4" fill="#7a4010" opacity="0.25"/>
      {/* bowl body */}
      <path d="M12 38 Q12 64 36 64 Q60 64 60 38 Z" fill="#c07830" stroke="#7a4010" strokeWidth="2.5" {...S}/>
      {/* bowl rim */}
      <ellipse cx="36" cy="38" rx="24" ry="8" fill="#d49040" stroke="#7a4010" strokeWidth="2.5"/>
      {/* noodle mass */}
      <path d="M20 38 Q18 30 26 26 Q34 22 40 28 Q46 22 52 28 Q58 34 54 38" fill="#f5c840" stroke="#c09020" strokeWidth="1.5" {...S}/>
      {/* noodle swirls */}
      <path d="M24 38 Q22 32 28 28 Q34 24 38 30 Q42 26 48 30 Q52 34 50 38" stroke="#e8a820" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M26 40 Q24 34 30 30 Q36 26 40 32" stroke="#f5c840" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M38 40 Q36 34 42 30 Q48 28 50 34" stroke="#f5c840" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* sauce blobs */}
      <circle cx="30" cy="36" r="4.5" fill="#e53935" opacity="0.85"/>
      <circle cx="40" cy="40" r="4" fill="#e53935" opacity="0.85"/>
      <circle cx="24" cy="44" r="3.5" fill="#e53935" opacity="0.85"/>
    </svg>
  );
}

/* ─── PORK ──────────────────────────────────────────────────────────────── */
function PorkIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow drip */}
      <ellipse cx="36" cy="66" rx="24" ry="4" fill="#c05000" opacity="0.25"/>
      {/* glaze drip */}
      <path d="M18 56 Q16 64 22 66 Q30 68 36 66 Q42 68 50 66 Q56 64 54 56" fill="#f5a020" stroke="#c07010" strokeWidth="1.5" {...S}/>
      {/* layer 4 (bottom — dark meat) */}
      <rect x="12" y="48" width="48" height="10" rx="3" fill="#c84040" stroke="#7a1818" strokeWidth="2"/>
      {/* layer 3 fat */}
      <rect x="12" y="40" width="48" height="10" rx="2" fill="#f5d0c0" stroke="#d09080" strokeWidth="1.5"/>
      {/* layer 2 meat */}
      <rect x="12" y="30" width="48" height="12" rx="2" fill="#d45060" stroke="#7a1818" strokeWidth="2"/>
      {/* fat streak layer 2 */}
      <path d="M16 36 Q36 33 56 36" stroke="#f5d0c0" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* layer 1 (top — light fat) */}
      <rect x="12" y="20" width="48" height="12" rx="4" fill="#f8e0d0" stroke="#c09080" strokeWidth="2"/>
      {/* highlight */}
      <path d="M16 24 Q36 20 56 24" stroke="#fff8f4" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* rind top */}
      <rect x="12" y="16" width="48" height="6" rx="3" fill="#d4a060" stroke="#8a5020" strokeWidth="2"/>
    </svg>
  );
}

/* ─── SEAFOOD ───────────────────────────────────────────────────────────── */
function SeafoodIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shrimp body curved */}
      <path d="M20 62 C6 52 4 34 14 20 C20 12 32 8 42 14 C52 20 54 34 48 44 C44 52 38 56 34 60 C30 64 26 66 22 64 Z" fill="#ef8060" stroke="#c04020" strokeWidth="2.5" {...S}/>
      {/* belly segmentation lines */}
      <path d="M22 58 C12 50 10 36 16 24" stroke="#f5a080" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M24 52 C18 46 16 36 20 26" stroke="#c04020" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M32 56 C28 50 24 40 26 30" stroke="#c04020" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
      {/* tail fan */}
      <path d="M22 64 L14 70 M22 64 L20 72 M22 64 L28 70" stroke="#ef8060" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* head */}
      <circle cx="42" cy="14" r="8" fill="#ef8060" stroke="#c04020" strokeWidth="2.5"/>
      <circle cx="44" cy="12" r="2.5" fill="#2d2d2d"/>
      <circle cx="45" cy="11" r="1" fill="#fff" opacity="0.8"/>
      {/* antennae */}
      <path d="M46 9 Q52 4 60 6" stroke="#c04020" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M44 8 Q48 2 56 2" stroke="#ef8060" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* ─── SIDE ──────────────────────────────────────────────────────────────── */
function SideIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* bowl */}
      <path d="M12 38 Q12 62 36 62 Q60 62 60 38 Z" fill="#fff9e8" stroke="#8a6030" strokeWidth="2.5" {...S}/>
      <ellipse cx="36" cy="38" rx="24" ry="8" fill="#e8d8b0" stroke="#8a6030" strokeWidth="2.5"/>
      {/* lettuce big leaf */}
      <path d="M16 38 Q14 26 22 22 Q28 18 34 26 Q28 34 30 42" fill="#5aaa40" stroke="#306020" strokeWidth="1.5" {...S}/>
      <path d="M24 36 Q22 24 30 20 Q38 16 42 26 Q38 32 40 42" fill="#72c452" stroke="#3a7828" strokeWidth="1.5" {...S}/>
      <path d="M36 38 Q36 26 44 22 Q52 20 54 30 Q50 36 52 44" fill="#5aaa40" stroke="#306020" strokeWidth="1.5" {...S}/>
      {/* tomato */}
      <circle cx="26" cy="44" r="6.5" fill="#ef5350" stroke="#b71c1c" strokeWidth="1.5"/>
      <circle cx="25" cy="43" r="2.5" fill="#ff8a80" opacity="0.6"/>
      {/* cucumber slices */}
      <ellipse cx="44" cy="46" rx="6" ry="5" fill="#a5d6a7" stroke="#2e7d32" strokeWidth="1.5"/>
      <ellipse cx="44" cy="46" rx="3" ry="2.5" fill="#c8e6c9"/>
      <line x1="44" y1="43" x2="44" y2="49" stroke="#388e3c" strokeWidth="1" opacity="0.6"/>
      <line x1="41" y1="46" x2="47" y2="46" stroke="#388e3c" strokeWidth="1" opacity="0.6"/>
    </svg>
  );
}

/* ─── STARTER ───────────────────────────────────────────────────────────── */
function StarterIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow */}
      <ellipse cx="36" cy="66" rx="24" ry="4" fill="#a07010" opacity="0.25"/>
      {/* bottom bun */}
      <ellipse cx="36" cy="58" rx="24" ry="8" fill="#d49030" stroke="#8a5010" strokeWidth="2.5"/>
      {/* bread body */}
      <path d="M12 42 Q12 58 36 58 Q60 58 60 42 Q60 26 36 24 Q12 26 12 42Z" fill="#e8b040" stroke="#8a5010" strokeWidth="2.5" {...S}/>
      {/* top dome */}
      <path d="M14 36 Q16 22 36 20 Q56 22 58 36" fill="#f5c840" stroke="#8a5010" strokeWidth="2" {...S}/>
      {/* highlight sheen */}
      <path d="M20 28 Q28 20 44 24" stroke="#fff9c4" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* score lines */}
      <path d="M22 42 Q36 36 50 42" stroke="#c09020" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M18 50 Q36 44 54 50" stroke="#c09020" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* sesame seeds */}
      <ellipse cx="28" cy="30" rx="3" ry="1.5" fill="#fff9c4" transform="rotate(-20 28 30)"/>
      <ellipse cx="36" cy="26" rx="3" ry="1.5" fill="#fff9c4"/>
      <ellipse cx="44" cy="30" rx="3" ry="1.5" fill="#fff9c4" transform="rotate(20 44 30)"/>
    </svg>
  );
}

/* ─── VEGAN ─────────────────────────────────────────────────────────────── */
function VeganIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* shadow */}
      <ellipse cx="38" cy="68" rx="14" ry="3.5" fill="#b05010" opacity="0.25"/>
      {/* carrot body */}
      <path d="M24 16 L44 22 L36 64 Z" fill="#ff8a40" stroke="#c05010" strokeWidth="2.5" {...S}/>
      <path d="M24 16 L36 64 L28 66 Z" fill="#ff7020" stroke="#c05010" strokeWidth="1.5" {...S}/>
      {/* texture lines */}
      <path d="M26 28 Q36 25 44 28" stroke="#e05010" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M28 40 Q37 37 44 40" stroke="#e05010" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M30 52 Q37 50 42 52" stroke="#e05010" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      {/* highlight */}
      <path d="M26 20 Q32 14 40 20" stroke="#ffb070" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* green leaves */}
      <path d="M34 16 Q26 6 16 8 Q20 16 28 18" fill="#388e3c" stroke="#1b5e20" strokeWidth="1.5" {...S}/>
      <path d="M34 16 Q30 4 36 4 Q38 12 34 16" fill="#43a047" stroke="#1b5e20" strokeWidth="1.5" {...S}/>
      <path d="M34 16 Q42 4 50 8 Q46 16 38 18" fill="#388e3c" stroke="#1b5e20" strokeWidth="1.5" {...S}/>
      <path d="M34 16 Q46 8 54 12 Q50 20 42 20" fill="#2e7d32" stroke="#1b5e20" strokeWidth="1.5" {...S}/>
    </svg>
  );
}

/* ─── VEGETARIAN ────────────────────────────────────────────────────────── */
function VegetarianIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      {/* stalk */}
      <rect x="31" y="50" width="10" height="18" rx="5" fill="#558b2f" stroke="#2e5010" strokeWidth="2"/>
      {/* shadow */}
      <ellipse cx="36" cy="68" rx="12" ry="3" fill="#2e5010" opacity="0.25"/>
      {/* main stem behind */}
      <circle cx="36" cy="32" r="17" fill="#4caf50" stroke="#1b5e20" strokeWidth="2.5"/>
      {/* bumpy top heads */}
      <circle cx="24" cy="24" r="12" fill="#66bb6a" stroke="#2e7d32" strokeWidth="2.5"/>
      <circle cx="36" cy="18" r="12" fill="#66bb6a" stroke="#2e7d32" strokeWidth="2.5"/>
      <circle cx="48" cy="24" r="12" fill="#66bb6a" stroke="#2e7d32" strokeWidth="2.5"/>
      {/* floret heads - inner */}
      <circle cx="24" cy="26" r="8" fill="#4caf50" stroke="#2e7d32" strokeWidth="1.5"/>
      <circle cx="36" cy="20" r="8" fill="#4caf50" stroke="#2e7d32" strokeWidth="1.5"/>
      <circle cx="48" cy="26" r="8" fill="#4caf50" stroke="#2e7d32" strokeWidth="1.5"/>
      {/* highlights */}
      <circle cx="21" cy="21" r="4" fill="#a5d6a7" opacity="0.6"/>
      <circle cx="34" cy="15" r="4" fill="#a5d6a7" opacity="0.6"/>
      <circle cx="51" cy="21" r="4" fill="#a5d6a7" opacity="0.6"/>
    </svg>
  );
}

/* ─── REGISTRY ──────────────────────────────────────────────────────────── */
const ICONS: Record<string, () => ReactElement> = {
  Beef:          BeefIcon,
  Breakfast:     BreakfastIcon,
  Chicken:       ChickenIcon,
  Dessert:       DessertIcon,
  Goat:          GoatIcon,
  Lamb:          LambIcon,
  Miscellaneous: MiscIcon,
  Pasta:         PastaIcon,
  Pork:          PorkIcon,
  Seafood:       SeafoodIcon,
  Side:          SideIcon,
  Starter:       StarterIcon,
  Vegan:         VeganIcon,
  Vegetarian:    VegetarianIcon,
};

/* ─── EXPORT ────────────────────────────────────────────────────────────── */
export function CategoryIllustration({
  name,
  active,
  size = 56,
  index = 0,
}: {
  name: string;
  active?: boolean;
  size?: number;
  index?: number;
}) {
  const Icon = ICONS[name];
  const [popping, setPopping] = useState(false);

  const stagger = `icon-d${index % 14}`;

  const handlePop = () => {
    setPopping(true);
    setTimeout(() => setPopping(false), 460);
  };

  return (
    <div
      style={{ width: size, height: size }}
      onMouseEnter={handlePop}
      onTouchStart={handlePop}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-200
        ${active ? "bg-primary/10 ring-2 ring-primary ring-offset-1 scale-110" : "bg-surface"}
        ${popping ? "icon-animate-pop" : `icon-animate ${stagger}`}
      `}
    >
      {Icon ? (
        <div style={{ width: size * 0.72, height: size * 0.72 }}>
          <Icon />
        </div>
      ) : (
        <span style={{ fontSize: size * 0.46 }}>🍴</span>
      )}
    </div>
  );
}

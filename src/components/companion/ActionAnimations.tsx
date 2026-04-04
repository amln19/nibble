"use client";

import type { CookingAction } from "@/lib/gordon/types";

type AnimProps = { color: string; size: number };

function ChopAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <line x1="18" y1="63" x2="62" y2="63" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      <g className="act-chop">
        <rect x="32" y="14" width="12" height="9" rx="3" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <path d="M 36 23 L 40 23 L 42 56 L 32 56 Z" fill={color} opacity="0.65" />
      </g>
    </svg>
  );
}

function StirAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="44" r="22" stroke={color} strokeWidth="1.5" opacity="0.2" />
      <circle cx="40" cy="44" r="12" stroke={color} strokeWidth="1" opacity="0.1" strokeDasharray="3 3" />
      <g className="act-stir" style={{ transformOrigin: "40px 44px" }}>
        <line x1="40" y1="20" x2="40" y2="47" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="40" cy="47" r="3.5" fill={color} opacity="0.3" />
      </g>
    </svg>
  );
}

function SimmerAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M 22 44 L 22 60 Q 22 68 40 68 Q 58 68 58 60 L 58 44" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="18" y1="44" x2="62" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <circle cx="33" cy="54" r="2" fill={color} opacity="0.5" className="act-bubble" style={{ animationDelay: "0s" }} />
      <circle cx="44" cy="58" r="1.5" fill={color} opacity="0.4" className="act-bubble" style={{ animationDelay: "0.7s" }} />
      <circle cx="38" cy="50" r="2.5" fill={color} opacity="0.35" className="act-bubble" style={{ animationDelay: "1.4s" }} />
    </svg>
  );
}

function BakeAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="18" y="42" width="44" height="30" rx="4" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <rect x="26" y="50" width="28" height="14" rx="2" stroke={color} strokeWidth="1" opacity="0.15" />
      <line x1="26" y1="46" x2="54" y2="46" stroke={color} strokeWidth="1" opacity="0.15" />
      <path d="M 30 38 Q 32 32 34 38" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" className="act-heat" style={{ animationDelay: "0s" }} />
      <path d="M 38 36 Q 40 30 42 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" className="act-heat" style={{ animationDelay: "0.5s" }} />
      <path d="M 46 38 Q 48 32 50 38" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.45" className="act-heat" style={{ animationDelay: "1s" }} />
    </svg>
  );
}

function PourAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <g transform="rotate(-25, 24, 30)">
        <rect x="14" y="16" width="20" height="28" rx="3" stroke={color} strokeWidth="1.5" opacity="0.35" />
        <line x1="14" y1="22" x2="34" y2="22" stroke={color} strokeWidth="1" opacity="0.2" />
      </g>
      <path d="M 34 34 Q 42 44 44 60" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" className="act-pour-stream" strokeDasharray="32" />
      <ellipse cx="46" cy="66" rx="10" ry="3" fill={color} opacity="0.15" />
    </svg>
  );
}

function SeasonAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="31" y="14" width="18" height="24" rx="5" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <rect x="34" y="10" width="12" height="6" rx="2" fill={color} opacity="0.25" />
      <circle cx="37" cy="38" r="1" fill={color} opacity="0.25" />
      <circle cx="43" cy="38" r="1" fill={color} opacity="0.25" />
      <circle cx="35" cy="44" r="1.5" fill={color} className="act-fall" style={{ animationDelay: "0s" }} />
      <circle cx="40" cy="42" r="1" fill={color} className="act-fall" style={{ animationDelay: "0.25s" }} />
      <circle cx="45" cy="44" r="1.5" fill={color} className="act-fall" style={{ animationDelay: "0.5s" }} />
      <circle cx="38" cy="46" r="1" fill={color} className="act-fall" style={{ animationDelay: "0.75s" }} />
      <circle cx="42" cy="45" r="1.5" fill={color} className="act-fall" style={{ animationDelay: "1s" }} />
    </svg>
  );
}

function WhiskAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <g className="act-whisk" style={{ transformOrigin: "40px 22px" }}>
        <line x1="40" y1="10" x2="40" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <ellipse cx="40" cy="54" rx="10" ry="18" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="40" cy="54" rx="6" ry="18" stroke={color} strokeWidth="1" opacity="0.3" />
        <ellipse cx="40" cy="54" rx="2" ry="18" stroke={color} strokeWidth="1" opacity="0.2" />
      </g>
    </svg>
  );
}

function RestAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="24" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <line x1="40" y1="18" x2="40" y2="22" stroke={color} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="40" y1="58" x2="40" y2="62" stroke={color} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="18" y1="40" x2="22" y2="40" stroke={color} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="58" y1="40" x2="62" y2="40" stroke={color} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="40" y1="40" x2="40" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="40" y1="40" x2="40" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" className="act-clock-hand" style={{ transformOrigin: "40px 40px" }} />
      <circle cx="40" cy="40" r="2.5" fill={color} opacity="0.6" />
    </svg>
  );
}

function MixAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <g className="act-mix" style={{ transformOrigin: "40px 40px" }}>
        <path d="M 22 40 A 18 18 0 0 1 58 40" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <path d="M 54 36 L 58 40 L 54 44" fill={color} opacity="0.6" />
        <path d="M 58 40 A 18 18 0 0 1 22 40" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <path d="M 26 44 L 22 40 L 26 36" fill={color} opacity="0.6" />
      </g>
    </svg>
  );
}

function BoilAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M 22 42 L 22 58 Q 22 68 40 68 Q 58 68 58 58 L 58 42" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <line x1="18" y1="42" x2="62" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <circle cx="30" cy="54" r="3" fill={color} opacity="0.45" className="act-boil-bubble" style={{ animationDelay: "0s" }} />
      <circle cx="46" cy="56" r="2.5" fill={color} opacity="0.35" className="act-boil-bubble" style={{ animationDelay: "0.25s" }} />
      <circle cx="36" cy="50" r="3.5" fill={color} opacity="0.3" className="act-boil-bubble" style={{ animationDelay: "0.5s" }} />
      <circle cx="52" cy="52" r="2" fill={color} opacity="0.4" className="act-boil-bubble" style={{ animationDelay: "0.75s" }} />
      <path d="M 34 36 Q 36 30 38 36" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25" className="act-heat" style={{ animationDelay: "0.2s" }} />
      <path d="M 44 36 Q 46 30 48 36" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.25" className="act-heat" style={{ animationDelay: "0.8s" }} />
    </svg>
  );
}

function PeelAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <ellipse cx="36" cy="44" rx="14" ry="18" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <path d="M 50 28 Q 56 34 54 44 Q 52 54 56 60" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" className="act-peel-strip" style={{ transformOrigin: "50px 28px" }} />
      <line x1="50" y1="24" x2="50" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function PlateAnim({ color, size }: AnimProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="42" r="20" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <circle cx="40" cy="42" r="12" stroke={color} strokeWidth="1" opacity="0.12" />
      <g opacity="0.4">
        <line x1="12" y1="26" x2="12" y2="62" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="26" x2="8" y2="36" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <line x1="12" y1="26" x2="12" y2="36" stroke={color} strokeWidth="1" strokeLinecap="round" />
        <line x1="16" y1="26" x2="16" y2="36" stroke={color} strokeWidth="1" strokeLinecap="round" />
      </g>
      <g opacity="0.4">
        <line x1="68" y1="26" x2="68" y2="62" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 68 26 Q 74 36 68 46" stroke={color} strokeWidth="1" />
      </g>
      <circle cx="40" cy="42" r="5" fill={color} opacity="0.08" className="act-plate-glow" />
    </svg>
  );
}

const ANIMATION_MAP: Record<CookingAction, React.FC<AnimProps>> = {
  chop: ChopAnim,
  stir: StirAnim,
  simmer: SimmerAnim,
  bake: BakeAnim,
  pour: PourAnim,
  season: SeasonAnim,
  whisk: WhiskAnim,
  rest: RestAnim,
  mix: MixAnim,
  boil: BoilAnim,
  peel: PeelAnim,
  plate: PlateAnim,
};

export function ActionAnimation({
  action,
  accentColor,
  size = 100,
}: {
  action: CookingAction;
  accentColor?: string | null;
  size?: number;
}) {
  const color = accentColor || "#fbbf24";
  const Component = ANIMATION_MAP[action] ?? PlateAnim;
  return <Component color={color} size={size} />;
}

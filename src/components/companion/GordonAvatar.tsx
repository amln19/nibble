"use client";

type GordonMood = "idle" | "speaking" | "thinking" | "celebrating";

export function GordonAvatar({
  mood = "idle",
  size = 96,
  className = "",
}: {
  mood?: GordonMood;
  size?: number;
  className?: string;
}) {
  const moodClass =
    mood === "speaking"
      ? "gordon-speaking"
      : mood === "thinking"
        ? "gordon-thinking"
        : mood === "celebrating"
          ? "gordon-celebrating"
          : "gordon-idle";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${moodClass} ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Gordon the Goose is ${mood}`}
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full gordon-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse cx="60" cy="78" rx="28" ry="24" fill="#fafafa" stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Wing */}
        <path
          className="gordon-wing"
          d="M82 68 Q98 60 92 82 Q88 90 82 78Z"
          fill="#f3f4f6"
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Neck */}
        <path d="M52 58 C50 42 48 32 52 22" stroke="#fafafa" strokeWidth="16" strokeLinecap="round" />
        <path d="M52 58 C50 42 48 32 52 22" stroke="#e5e7eb" strokeWidth="1" fill="none" />

        {/* Head */}
        <circle cx="52" cy="22" r="14" fill="#fafafa" stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Chef hat base */}
        <ellipse cx="52" cy="12" rx="16" ry="5" fill="white" stroke="#d1d5db" strokeWidth="1" />

        {/* Chef hat puffs */}
        <circle cx="44" cy="5" r="7" fill="white" stroke="#d1d5db" strokeWidth="1" />
        <circle cx="52" cy="2" r="8" fill="white" stroke="#d1d5db" strokeWidth="1" />
        <circle cx="60" cy="5" r="7" fill="white" stroke="#d1d5db" strokeWidth="1" />
        <rect x="40" y="5" width="24" height="8" fill="white" />

        {/* Eye */}
        <circle cx="47" cy="20" r="3" fill="#1a1a2e" />
        <circle cx="46" cy="19" r="1" fill="white" />

        {/* Beak - two parts for speaking animation */}
        <path
          className="gordon-beak-top"
          d="M38 23 L28 20 L38 22Z"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="0.5"
        />
        <path
          className="gordon-beak-bottom"
          d="M38 23 L28 26 L38 25Z"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="0.5"
        />

        {/* Feet */}
        <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M48 100 L40 106 M48 100 L48 106 M48 100 L56 106" />
          <path d="M68 100 L60 106 M68 100 L68 106 M68 100 L76 106" />
        </g>

        {/* Blush (subtle) */}
        <circle cx="40" cy="26" r="3.5" fill="#fecdd3" opacity="0.5" />
      </svg>

      {/* Thinking dots */}
      {mood === "thinking" && (
        <div className="absolute -right-1 top-1/4 flex gap-1">
          <span className="gordon-dot h-2 w-2 rounded-full bg-amber-400" style={{ animationDelay: "0s" }} />
          <span className="gordon-dot h-2.5 w-2.5 rounded-full bg-amber-400" style={{ animationDelay: "0.2s" }} />
          <span className="gordon-dot h-3 w-3 rounded-full bg-amber-400" style={{ animationDelay: "0.4s" }} />
        </div>
      )}

      {/* Celebration sparkles */}
      {mood === "celebrating" && (
        <>
          <span className="gordon-sparkle absolute -top-2 -left-1 text-lg">✨</span>
          <span className="gordon-sparkle absolute -top-1 -right-2 text-sm" style={{ animationDelay: "0.3s" }}>⭐</span>
          <span className="gordon-sparkle absolute -bottom-1 right-0 text-base" style={{ animationDelay: "0.6s" }}>🌟</span>
        </>
      )}
    </div>
  );
}

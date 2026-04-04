import Image from "next/image";

const variantClasses = {
  /** Compact header mark */
  header:
    "h-9 w-9 min-[400px]:h-10 min-[400px]:w-10 sm:h-11 sm:w-11",
  /** Sign-in hero */
  hero:
    "h-40 w-40 min-[400px]:h-44 min-[400px]:w-44 sm:h-52 sm:w-52",
  welcome: "h-36 w-36 sm:h-44 sm:w-44",
  splash: "h-24 w-24",
} as const;

type BrandMascotProps = {
  variant?: keyof typeof variantClasses;
  className?: string;
  priority?: boolean;
  alt?: string;
};

/**
 * Circular mark: green disc + mascot from Goose Cooks asset.
 */
export function BrandMascot({
  variant = "hero",
  className = "",
  priority = false,
  alt = "Nibble goose",
}: BrandMascotProps) {
  const dim = variantClasses[variant];
  const sizesAttr =
    variant === "splash"
      ? "96px"
      : variant === "header"
        ? "44px"
        : variant === "welcome"
          ? "(max-width: 640px) 144px, 176px"
          : "(max-width: 640px) 176px, 208px";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-green-600 shadow-[0_8px_28px_rgba(22,163,74,0.35)] ring-2 ring-green-500/50 ${dim} ${className}`.trim()}
    >
      <Image
        src="/goose-cooks-logo.png"
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-[50%_31%] scale-[1.78]"
        sizes={sizesAttr}
      />
    </div>
  );
}

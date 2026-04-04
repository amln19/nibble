import type { Metadata } from "next";
import { CompanionMode } from "@/components/companion/CompanionMode";

export const metadata: Metadata = {
  title: "Cook with Gordon",
  description: "Your personal goose chef guides you through the recipe, step by step.",
};

export default async function CookPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <CompanionMode recipeId={id ?? null} />;
}

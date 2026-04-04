import type { Metadata } from "next";
import { PrepClient } from "@/components/prep/PrepClient";

export const metadata: Metadata = {
  title: "Virtual Kitchen Prep",
  description: "Practice your cooking skills in the virtual kitchen before the real thing.",
};

export default async function PrepPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <PrepClient recipeId={id ?? null} />;
}

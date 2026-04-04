import type { NextConfig } from "next";

function supabaseStoragePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return undefined;
  try {
    const host = new URL(raw).hostname;
    return {
      protocol: "https",
      hostname: host,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return undefined;
  }
}

const supabasePattern = supabaseStoragePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabasePattern ? [supabasePattern] : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.themealdb.com",
        pathname: "/**",
      },
    ],
  },
  // When a lockfile exists higher in the tree (e.g. home), point Turbopack at this app.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

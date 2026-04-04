import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When a lockfile exists higher in the tree (e.g. home), point Turbopack at this app.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

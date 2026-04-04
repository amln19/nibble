import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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

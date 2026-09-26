import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  // The Playwright suite talks to the dev server over 127.0.0.1 instead of localhost;
  // without this, Next.js blocks its dev resources cross-origin and logs a warning per run.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;

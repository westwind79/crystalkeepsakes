import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  // Only use static export for builds, not development
  ...(isDev ? {} : { output: 'export' }),
  distDir: 'out',
  basePath: basePath,
  assetPrefix: basePath,
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["swiper"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "crystalkeepsakes.com" },
      { protocol: "https", hostname: "profit.cockpit3d.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    // Disable features that don't work with static export
    ppr: false,
  },
  compiler: {
    removeConsole:
      process.env.NEXT_PUBLIC_ENV_MODE === "production"
        ? { exclude: ["error"] }
        : false,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';

// basePath must be empty string or start with / but not be just /
let basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
if (basePath === '/') basePath = ''; // Fix: "/" is not allowed
basePath = basePath.trim(); // Remove any whitespace

// Separate output directories for different environments
const distDir = envMode === 'testing' ? 'out-test' : 'out';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  output: 'export',
  distDir: distDir,
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
  compiler: {
    removeConsole:
      process.env.NEXT_PUBLIC_ENV_MODE === "production"
        ? { exclude: ["error"] }
        : false,
  },
};

export default nextConfig;

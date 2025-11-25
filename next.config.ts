import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';

// basePath must be empty string or start with / but not be just /
let basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
if (basePath === '/') basePath = ''; // Fix: "/" is not allowed
basePath = basePath.trim(); // Remove any whitespace

// ✅ CRITICAL: Always use .next for dev mode, separate dirs for builds
const getDistDir = () => {
  // ALWAYS use .next for development (yarn dev)
  if (isDev || process.env.NODE_ENV === 'development') {
    return '.next';
  }
  
  // For builds only (yarn build:test, yarn build:prod, etc)
  if (process.env.BUILD_MODE === 'test') return 'out-test';
  if (process.env.BUILD_MODE === 'prod') return 'out-prod';
  if (process.env.BUILD_MODE === 'local') return 'out';
  
  // Fallback for builds
  if (envMode === 'testing') return 'out-test';
  if (envMode === 'production') return 'out-prod';
  
  // Default for builds
  return 'out';
};

const distDir = getDistDir();

console.log(`
╔════════════════════════════════════════════════════╗
║         BUILD CONFIGURATION - NextConfig           ║
╠════════════════════════════════════════════════════╣
║ Environment:  ${envMode.padEnd(24)}             ║
║ Base Path:    ${(basePath || '(root)').padEnd(24)} ║
║ Output Dir:   ${distDir.padEnd(24)}             ║
╚════════════════════════════════════════════════════╝
`);

const nextConfig: NextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  output: 'export',
  distDir: distDir,
  basePath: basePath,
  assetPrefix: basePath,
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["swiper"],
  typescript: { ignoreBuildErrors: true },
  
<<<<<<< HEAD
  // ✅ EXCLUDE ADMIN PANEL FROM PRODUCTION/TEST BUILDS
  // Admin panel should ONLY exist in local development
  // Note: rewrites() and redirects() removed - not compatible with output: 'export'
  // Admin panel will be excluded during build via scripts/remove-admin-from-build.js
=======
  // Note: rewrites/redirects don't work with output: 'export'
  // Admin panel is excluded at build time via remove-admin-from-build.js script
>>>>>>> conflict_241125_2301
  
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

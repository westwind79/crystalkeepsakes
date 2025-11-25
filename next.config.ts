import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';

// basePath must be empty string or start with / but not be just /
let basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
if (basePath === '/') basePath = ''; // Fix: "/" is not allowed
basePath = basePath.trim(); // Remove any whitespace

// ✅ CRITICAL FIX: Separate output directories to prevent overwriting!
// This prevents test builds from overwriting production builds
const getDistDir = () => {
  // Check for explicit BUILD_MODE from environment
  if (process.env.BUILD_MODE === 'test') return 'out-test';
  if (process.env.BUILD_MODE === 'prod') return 'out-prod';
  if (process.env.BUILD_MODE === 'local') return 'out';
  
  // Fallback: determine by env mode
  if (envMode === 'testing') return 'out-test';
  if (envMode === 'production') return 'out-prod';
  
  return 'out'; // local/development
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
  
  // ✅ EXCLUDE ADMIN PANEL FROM PRODUCTION/TEST BUILDS
  // Admin panel should ONLY exist in local development
  // Note: rewrites() removed - not compatible with output: 'export'
  
  // Exclude admin from static generation in prod/test builds
  ...(envMode !== 'development' && {
    async redirects() {
      return [
        {
          source: '/admin',
          destination: '/',
          permanent: false,
        },
      ];
    },
  }),
  
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

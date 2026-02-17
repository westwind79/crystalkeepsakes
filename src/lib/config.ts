// lib/config.ts
// Centralized configuration - ONLY uses standardized env variable names

export const config = {
  // Environment
  envMode: process.env.NEXT_PUBLIC_ENV_MODE || 'development',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Backend
  phpBackendUrl: process.env.NEXT_PUBLIC_PHP_BACKEND_URL || '',
  
  // Stripe - ONLY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Cockpit3D
  cockpit3dShopId: process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID || '',
  
  // Helpers
  isProduction: process.env.NEXT_PUBLIC_ENV_MODE === 'production',
  isTesting: process.env.NEXT_PUBLIC_ENV_MODE === 'testing',
  isDevelopment: process.env.NEXT_PUBLIC_ENV_MODE === 'development' || !process.env.NEXT_PUBLIC_ENV_MODE,
}

export default config

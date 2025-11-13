export const config = {
  isProduction: process.env.NEXT_PUBLIC_ENV_MODE === 'production',
  
  cockpit3d: {
    retailerId: process.env.COCKPIT3D_RETAIL_ID || process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID,
    baseUrl: process.env.COCKPIT3D_BASE_URL,
    username: process.env.COCKPIT3D_USERNAME,
    password: process.env.COCKPIT3D_PASSWORD,
    apiToken: process.env.COCKPIT3D_API_TOKEN,
  },
  
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_ENV_MODE === 'production'
      ? process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY
      : process.env.NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY,
  },
  
  mamp: {
    port: process.env.NEXT_PUBLIC_MAMP_PORT || '8888',
  },
} as const
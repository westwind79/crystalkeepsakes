// src/config/index.js
const config = {
  env: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')
  },

  square: {
    environment: import.meta.env.VITE_SQUARE_ENVIRONMENT,
    accessToken: import.meta.env.VITE_SQUARE_ACCESS_TOKEN,
    locationId: import.meta.env.VITE_SQUARE_LOCATION_ID
  },

  site: {
    url: import.meta.env.VITE_SITE_URL
  },

  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true'
  }
};

// Validate required config at runtime
const validateConfig = () => {
  const required = {
    'VITE_API_URL': config.api.baseUrl,
    'VITE_SQUARE_ENVIRONMENT': config.square.environment,
    'VITE_SQUARE_ACCESS_TOKEN': config.square.accessToken,
    'VITE_SQUARE_LOCATION_ID': config.square.locationId,
    'VITE_SITE_URL': config.site.url
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

if (config.isProduction) {
  validateConfig();
}

export default config;
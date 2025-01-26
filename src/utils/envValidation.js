// utils/envValidation.js
const requiredVars = [
  'VITE_API_URL',
  'VITE_SQUARE_ENVIRONMENT',
  'VITE_SQUARE_ACCESS_TOKEN',
  'VITE_SQUARE_LOCATION_ID',
  'VITE_SITE_URL'
];

export function validateEnv() {
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
  
  // Validate URL formats
  try {
    new URL(import.meta.env.VITE_API_URL);
    new URL(import.meta.env.VITE_SITE_URL);
  } catch (error) {
    throw new Error('Invalid URL format in environment variables');
  }

  // Validate Square environment
  if (!['sandbox', 'production'].includes(import.meta.env.VITE_SQUARE_ENVIRONMENT)) {
    throw new Error('Invalid Square environment specified');
  }
}
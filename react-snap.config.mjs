// react-snap.config.mjs
import { products } from './src/data/products.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate all routes including dynamic product routes
const routes = [
  '/',
  '/about',
  '/products',
  '/contact',
  '/faq',
  ...products.map(p => `/product/${p.slug}`)
];

// Export the configuration
export default {
  source: resolve(__dirname, 'dist'),           // Make sure this matches Vite's output
  destination: resolve(__dirname, 'dist'),      // And this too
  include: routes,
  exclude: [
    '/cart',
    '/order-confirmation'
  ],
  excludeUserAgents: ["googlebot"],
  minifyHtml: {
    collapseWhitespace: true,
    removeComments: true
  },
  puppeteerArgs: [
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ],
  crawl: true,
  puppeteer: {
    cache: true
  },
  inlineCss: true,
  removeBlobs: true,
  preloadImages: true,
  preconnectThirdParty: true,
  http2PushManifest: true,
  skipThirdPartyRequests: false,
  cacheAjaxRequests: true,
  removeScriptTags: false,
  fixWebpackChunksIssue: false,              // Add this since we're using Vite
  fixInsertRule: true,                       // Help with style handling
  async afterStart(options) {                // Add logging for debugging
    console.log('Starting react-snap with options:', options);
    console.log('Looking for files in:', options.source);
  }
};
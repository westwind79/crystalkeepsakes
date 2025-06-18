import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'
<<<<<<< HEAD
import { fileURLToPath } from 'url'
import { compression } from 'vite-plugin-compression2'

// Get current directory in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import products for generating routes
import { products } from './src/data/static-products.js'


// Function to handle post-build tasks
const postBuildTasks = () => ({
  name: 'post-build-tasks',
  writeBundle: async () => {
    console.log('Running post-build tasks...');
    
    // Copy API and other necessary files (ONCE)
=======

// Copy function for API folder
const copyAPI = () => ({
  name: 'copy-api',
  closeBundle: async () => {
    // Ensure dist directory exists
>>>>>>> development
    await fs.ensureDir('dist');
    
    // Copy API folder and its contents
    await fs.copy('api', 'dist/api');
<<<<<<< HEAD
    await fs.copy('./src/admin', 'dist/admin');
    
    const combinedFile = 'src/data/cockpit3d-products.js';
    const rawCatalogFile = 'src/data/cockpit3d-raw-catalog.js';
    const rawProductsFile = 'src/data/cockpit3d-raw-products.js';
    
    if (fs.existsSync(combinedFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(combinedFile, 'dist/data/cockpit3d-products.js');
      console.log('✅ Copied combined products file to dist');
    } else {
      console.warn('⚠️ Combined products file not found - run data generation first');
    }
    
    // Copy raw catalog file for ProductDetail2
    if (fs.existsSync(rawCatalogFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(rawCatalogFile, 'dist/data/cockpit3d-raw-catalog.js');
      console.log('✅ Copied raw catalog file to dist');
    } else {
      console.warn('⚠️ Raw catalog file not found - run data generation first');
    }
    
    // Copy raw catalog file for ProductDetail2
    if (fs.existsSync(rawProductsFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(rawProductsFile, 'dist/data/cockpit3d-raw-products.js');
      console.log('✅ Copied raw Products file to dist');
    } else {
      console.warn('⚠️ Raw Products file not found - run data generation first');
    }

    await fs.copy('.htaccess', 'dist/.htaccess');
    await fs.copy('robots.txt', 'dist/robots.txt');
    
    try {
      if (fs.existsSync('.env')) {
        await fs.copy('.env', 'dist/.env');
      }
    } catch (err) {
      console.warn('No .env file found, skipping')
    }
    
    // Generate sitemap
    const baseUrl = process.env.VITE_SITE_URL || 'https://crystalkeepsakes.com';
    const routes = ['/', '/products', '/products2', '/about', '/contact', '/faq', '/cart', '/order-confirmation'];
    let allProducts = [];
    
    // Try to load the combined products file for sitemap
    try {
      console.log('🔍 Looking for combined products file...');
    
      if (fs.existsSync(combinedFile)) {
        console.log('✅ Combined products file exists');
        const combinedContent = await fs.readFile(combinedFile, 'utf8');
        console.log('📄 File content length:', combinedContent.length);
        
        // Look for the export pattern
        const match = combinedContent.match(/export\s+const\s+cockpit3dProducts\s*=\s*(\[.*?\]);/s);
        if (match) {
          console.log('🎯 Found export pattern');
          try {
            allProducts = JSON.parse(match[1]);
            console.log(`📍 SITEMAP: Successfully loaded ${allProducts.length} products from combined file`);
            console.log('📍 First few products:', allProducts.slice(0, 3).map(p => p.name));
          } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            throw parseError;
          }
        } else {
          console.error('❌ Could not find export pattern in combined products file');
          console.log('📄 File preview:', combinedContent.substring(0, 500));
          throw new Error('Export pattern not found');
        }
      } else {
        console.error('❌ Combined products file does not exist:', combinedFile);
        throw new Error('File not found');
      }
    } catch (error) {
      console.warn('⚠️ Could not load combined products for sitemap:', error.message);
      console.warn('⚠️ Falling back to static products');
      
      // Fallback to static products
      const { products: staticProducts } = await import('./src/data/static-products.js');
      allProducts = staticProducts;
      console.log(`📍 SITEMAP: Using ${allProducts.length} static products as fallback`);
    }

    // Generate product routes ONLY for /product2/ paths (not the old /product/ routes)
    const productRoutes = allProducts.map(product => `/product2/${product.slug}`);
    console.log('📍 Generated product routes:', productRoutes.length);

    const allRoutes = [...routes, ...productRoutes];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${allRoutes.map(route => `
        <url>
          <loc>${baseUrl}${route}</loc>
          <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${route === '/' ? '1.0' : '0.8'}</priority>
        </url>
      `).join('')}
    </urlset>`;

    await fs.writeFile('dist/sitemap.xml', sitemap);
    console.log(`📍 Sitemap generated with ${allRoutes.length} routes (${productRoutes.length} product2 routes from ${allProducts.length} products)`);
      
    // Read the index.html template
    const indexHtml = await fs.readFile('dist/index.html', 'utf8');
    
    // Create 404 page
    await fs.writeFile('dist/404.html', indexHtml);
    
    // Create index.html files for each route for static hosting support
    for (const route of allRoutes) {
      if (route === '/') continue; // Skip root as it already exists
      
      const routePath = path.join('dist', route.slice(1));
      await fs.ensureDir(routePath);
      await fs.writeFile(path.join(routePath, 'index.html'), indexHtml);
    }
    
    console.log('Post-build tasks completed successfully!');
=======
    
    // Copy config folder maintaining structure
    await fs.copy('config', 'dist/config');
    
    // Copy htaccess file
    await fs.copy('.htaccess', 'dist/.htaccess');
>>>>>>> development
  }
});

<<<<<<< HEAD
export default defineConfig(async ({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'live';
  const useStripeTestKeys = !isProduction || env.VITE_STRIPE_MODE !== 'live';
  const siteUrl = env.VITE_SITE_URL || 'https://crystalkeepsakes.com';
  
  // Prepare plugins array
  const plugins = [
    react({
      fastRefresh: true
    }),
    postBuildTasks()
  ];
  
  // Add compression plugin for production
  if (isProduction) {
    plugins.push(compression());
  }
=======
export default defineConfig(({ command }) => {
  const isProduction = command !== 'serve';
>>>>>>> development
  
  return {
    plugins,
    define: {
      'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(
        useStripeTestKeys 
          ? env.VITE_STRIPE_TEST_PUBLISHABLE_KEY 
          : env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY
      ),
      'process.env.STRIPE_MODE': JSON.stringify(
        useStripeTestKeys ? 'test' : 'live'
      ),
      'process.env.IS_PRODUCTION': isProduction,
      'process.env.SITE_URL': JSON.stringify(siteUrl)
    },
    publicDir: 'public',
    base: command === 'serve' ? '' : '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            bootstrap: ['bootstrap', 'react-bootstrap']
          },
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            }
            return `${extType}/[name][extname]`;
          }
        }
      }
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      cors: true,
      watch: {
        usePolling: true,
        interval: 100
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8888',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/img/products/cockpit3d': {
          target: 'http://localhost:5174',
          changeOrigin: false,
          rewrite: (path) => path.replace('/img/products/cockpit3d', '/dist/img/products/cockpit3d')
        }
      },
      hmr: {
        protocol: 'ws',
        clientPort: 5174
      }
    }
  };
});
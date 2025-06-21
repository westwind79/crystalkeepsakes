import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { compression } from 'vite-plugin-compression2'

// Get current directory in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// FIXED: Define fallback products
const fallbackProducts = [
  {
    id: "900",
    name: "Static Laser Engraving",
    slug: "static-laser-engraving",
    sku: "static_laser_001",
    basePrice: 89.00
  },
  {
    id: "901", 
    name: "3D Printing",
    slug: "static-3d-printing",
    sku: "static_printing_001", 
    basePrice: 119.00
  }
];

// FIXED: Combined prebuild and post-build tasks plugin
const buildTasksPlugin = () => ({
  name: 'build-tasks-plugin',
  buildStart: async () => {
    console.log('🔍 Pre-build: Checking required files...');
    
    const finalProductFile = 'src/data/final-product-list.js'; 
    
    if (!fs.existsSync(finalProductFile)) {
      console.error('❌ CRITICAL: Neither final-product-list.js nor cockpit3d-products.js exists!');
      console.log('📝 Please either:');
      console.log('   1. Generate final-product-list.js using the ProductAdmin panel');
      console.log('   2. Start MAMP to generate cockpit3d-products.js via API');
      console.log('   3. Build will continue with fallback static products only');
    } else if (fs.existsSync(finalProductFile)) {
      console.log('✅ Pre-build: final-product-list.js found - will use for sitemap');
    } 
  },
  // Post-build tasks (existing functionality)
  writeBundle: async () => {
    console.log('🎯 Running post-build tasks...');
    
    // Copy API and other necessary files
    await fs.ensureDir('dist');
    await fs.copy('api', 'dist/api');
    await fs.copy('./src/admin', 'dist/admin');

     // Copy the final product list if it exists
    const finalProductFile = 'src/data/final-product-list.js';
    if (fs.existsSync(finalProductFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(finalProductFile, 'dist/data/final-product-list.js');
      console.log('✅ Copied final product list to dist');
    }
    
    // Copy other required files
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
    
    // Try to load the final product list for sitemap
    try {
      console.log('🔍 Looking for final product list for sitemap...');
      
      // FIXED: Look for the correct file
      const finalProductFile = 'src/data/final-product-list.js';
      
      if (fs.existsSync(finalProductFile)) {
        console.log('✅ Final product list file exists');
        const finalContent = await fs.readFile(finalProductFile, 'utf8');
        console.log('📄 File content length:', finalContent.length);
        
        // FIXED: Look for the correct export pattern
        const match = finalContent.match(/export\s+const\s+finalProductList\s*=\s*(\[.*?\]);/s);
        if (match) {
          console.log('🎯 Found finalProductList export pattern');
          try {
            allProducts = JSON.parse(match[1]);
            console.log(`📍 SITEMAP: Successfully loaded ${allProducts.length} products from final product list`);
            console.log('📍 First few products:', allProducts.slice(0, 3).map(p => ({ name: p.name, slug: p.slug })));
          } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            throw parseError;
          }
        } else {
          console.error('❌ Could not find finalProductList export pattern');
          console.log('📄 File preview:', finalContent.substring(0, 500));
          throw new Error('Export pattern not found');
        }
      } else {
        console.error('❌ Final product list file does not exist:', finalProductFile);
        throw new Error('File not found');
      }
    } catch (error) {
      console.warn('⚠️ Could not load final product list for sitemap:', error.message);
      console.warn('⚠️ Falling back to static products');
      
      // FIXED: Use the defined fallback products
      allProducts = fallbackProducts;
      console.log(`📍 SITEMAP: Using ${allProducts.length} fallback products`);
    }

    // Generate product routes ONLY for /product2/ paths (not the old /product/ routes)
    const productRoutes = allProducts.map(product => `/product2/${product.slug}`);
    console.log(`📍 Generated ${productRoutes.length} product routes`);

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
    
    console.log('✅ Post-build tasks completed successfully!');
      }  
    });

    // Copy function for API folder
    const copyAPI = () => ({
      name: 'copy-api',
      closeBundle: async () => {
        await fs.ensureDir('dist');
        await fs.copy('api', 'dist/api');  
        await fs.copy('config', 'dist/config')
        // Copy .htaccess file to specific path
        await fs.copy('.htaccess', path.join('dist', '.htaccess'))
      }
    });

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
    buildTasksPlugin() // FIXED: Combined plugin with both buildStart and writeBundle
  ];
  
  // Add compression plugin for production
  if (isProduction) {
    plugins.push(compression());
  }
  
  return {
    plugins,
    define: {
      'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(
        useStripeTestKeys 
          ? env.VITE_STRIPE_TEST_PUBLISHABLE_KEY 
          : env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY
      ),
      'process.env.STRIPE_MODE': JSON.stringify(
        useStripeTestKeys ? 'development' : 'live'
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
          assetFileNames: 'assets/[name]-[hash][extname]',
        }
      }
    },
    server: {
      host: true,
      port: 5174,
      strictPort: false,
      cors: true,
      watch: {
        usePolling: true,
        interval: 100
      },
      proxy: {
        '/api': {
          target: 'http://crystalkeepsakes:8888',
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
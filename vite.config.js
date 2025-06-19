import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { compression } from 'vite-plugin-compression2'
// import { prebuild } from './scripts/prebuild.js'  // Import the prebuild function

// Get current directory in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import products for generating routes
import { products } from './src/data/static-products.js'

// FIXED: Combined prebuild and post-build tasks plugin
const buildTasksPlugin = () => ({
  name: 'build-tasks-plugin',
  
  // FIXED: Run prebuild BEFORE build starts
  // buildStart: async () => {
  //   console.log('🚀 Running prebuild tasks...');
  //   try {
  //     await prebuild();
  //     console.log('✅ Prebuild tasks completed successfully');
  //   } catch (error) {
  //     console.error('❌ Prebuild failed:', error.message);
  //     // Don't fail the build - continue with fallback data
  //     console.warn('⚠️ Continuing with fallback data...');
  //   }
  // },
  
  // Post-build tasks (existing functionality)
  writeBundle: async () => {
    console.log('🎯 Running post-build tasks...');
    
    // Copy API and other necessary files
    await fs.ensureDir('dist');
    await fs.copy('api', 'dist/api');
    await fs.copy('./src/admin', 'dist/admin');
    
    const combinedFile = 'src/data/cockpit3d-products.js';
    const rawCatalogFile = 'src/data/cockpit3d-raw-catalog.js';
    const rawProductsFile = 'src/data/cockpit3d-raw-products.js';
    
    // Copy the generated products file
    if (fs.existsSync(combinedFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(combinedFile, 'dist/data/cockpit3d-products.js');
      console.log('✅ Copied combined products file to dist');
    } else {
      console.warn('⚠️ Combined products file not found - build may have incomplete data');
    }
    
    // Copy raw files if they exist
    if (fs.existsSync(rawCatalogFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(rawCatalogFile, 'dist/data/cockpit3d-raw-catalog.js');
      console.log('✅ Copied raw catalog file to dist');
    }
    
    if (fs.existsSync(rawProductsFile)) {
      await fs.ensureDir('dist/data');
      await fs.copy(rawProductsFile, 'dist/data/cockpit3d-raw-products.js');
      console.log('✅ Copied raw products file to dist');
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
    
    // Try to load the combined products file for sitemap
    try {
      console.log('🔍 Looking for combined products file for sitemap...');
    
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
            console.log('📍 First few products:', allProducts.slice(0, 3).map(p => ({ name: p.name, slug: p.slug })));
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
      allProducts = products;
      console.log(`📍 SITEMAP: Using ${allProducts.length} static products as fallback`);
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
          assetFileNames: (assetInfo) => {
            let extType = assetInfo.name.split('.').at(1);
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            }
            return `${extType}/[name]-[hash][extName]`;
          }
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

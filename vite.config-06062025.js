import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { compression } from 'vite-plugin-compression2'
import { createServer } from 'http'
import { createRequire } from 'module'
import puppeteer from 'puppeteer'

// Get current directory in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import products for generating routes
import { products } from './src/data/static-products.js'

// Function to handle post-build tasks
const postBuildTasks = () => ({
  name: 'post-build-tasks',
  closeBundle: async () => {
    console.log('Running post-build tasks...');
    
    // Copy API and other necessary files
    await fs.ensureDir('dist');
    await fs.copy('api', 'dist/api');
    await fs.copy('src/data', 'dist/data');
    // await fs.copy('config', 'dist/config');
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
    const routes = ['/', '/products', '/about', '/contact', '/faq', '/cart', '/order-confirmation'];
    const productRoutes = products.map(product => `/product/${product.slug}`);
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
    
    /* 
    NOTE: The prerendering functionality is commented out to prevent build errors
    If you need prerendering in the future, uncomment and install required dependencies
    
    // Optionally, add prerendering for SEO - this is a replacement for react-snap
    try {
      console.log('Starting prerendering...');
      
      // Set up a static file server for the dist directory
      const handler = await import('serve-handler').then(m => m.default);
      const server = createServer((req, res) => {
        return handler(req, res, { public: 'dist' });
      });
      
      // Start the server on a random port
      const PORT = 45678;
      server.listen(PORT);
      console.log(`Prerender server started on http://localhost:${PORT}`);
      
      // Launch headless browser
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      
      // Prerender each route
      for (const route of allRoutes) {
        console.log(`Prerendering ${route}...`);
        try {
          // Navigate to the page
          await page.goto(`http://localhost:${PORT}${route}`, {
            waitUntil: 'networkidle0',
          });
          
          // Get the rendered HTML
          const html = await page.content();
          
          // Write to the appropriate file
          const filePath = route === '/' 
            ? path.join('dist', 'index.html')
            : path.join('dist', route.slice(1), 'index.html');
          
          await fs.ensureDir(path.dirname(filePath));
          await fs.writeFile(filePath, html);
        } catch (err) {
          console.error(`Error prerendering ${route}:`, err);
        }
      }
      
      // Clean up
      await browser.close();
      server.close();
      console.log('Prerendering complete!');
    } catch (prerenderError) {
      console.error('Prerendering error:', prerenderError);
      console.log('Skipping prerendering, continuing with build...');
    }
    */
  }
});

export default defineConfig(async ({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
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
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'
import { products } from './src/data/products.js' // Using your exact import path
// Copy function for API folder - Fixed to run after the build is complete
const copyAPI = () => ({
name: 'copy-api',
// Change from closeBundle to writeBundle which runs after the files are written
  writeBundle: async () => {
    try {
      console.log('Starting copyAPI plugin...');
      // Create dist directory if it doesn't exist
      await fs.ensureDir('dist');
      
      // Copy the necessary folders and files
      console.log('Copying API folder...');
      await fs.copy('api', 'dist/api');
      
      console.log('Copying config folder...');
      await fs.copy('config', 'dist/config');
      
      console.log('Copying .htaccess file...');
      await fs.copy('.htaccess', 'dist/.htaccess');
      
      console.log('Copying .env file...');
      await fs.copy('.env', 'dist/.env');

      console.log('Copying robots.txt file...');
      await fs.copy('robots.txt', 'dist/robots.txt');

      // Your original routes
      const routePaths = ['/', '/products', '/about', '/contact', '/faq', '/cart', '/order-confirmation'];
      
      // Generate product paths
      const productPaths = products.map(product => `/product/${product.slug}`);
      
      // Combine all paths
      const allPaths = [...routePaths, ...productPaths];

      // Generate sitemap.xml
      console.log('Generating sitemap.xml...');
      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${allPaths.map(path => `
            <url>
              <loc>https://www.crystalkeepsakes.com${path}</loc>
              <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>${path === '/' ? '1.0' : '0.8'}</priority>
            </url>
          `).join('')}
        </urlset>`;

      await fs.writeFile('dist/sitemap.xml', sitemapContent);

      // Make sure index.html exists before trying to read it
      if (await fs.pathExists('dist/index.html')) {
        console.log('Reading index.html...');
        const indexHtml = await fs.readFile('dist/index.html', 'utf8');
        
        console.log('Creating route directories...');
        for (const route of allPaths) {
          const routePath = path.join('dist', route);
          await fs.ensureDir(routePath);
          await fs.writeFile(path.join(routePath, 'index.html'), indexHtml);
        }
        
        await fs.writeFile('dist/404.html', indexHtml);
        console.log('copyAPI plugin completed successfully');
      } else {
        console.error('ERROR: dist/index.html not found. Skipping route creation.');
      }

      await fs.writeFile('dist/404.html', indexHtml);

    } catch (error) {
      console.error('Error in copyAPI plugin:', error);
      throw error; // Re-throw to notify Vite of the error
    }
  }
});

export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = command !== 'serve';
  const useStripeTestKeys = !isProduction || env.VITE_STRIPE_MODE !== 'live';
    return {
      plugins: [
        react(),
        copyAPI()
      ],
      define: {
        // Make environment variables available to your app
        'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(useStripeTestKeys ? env.VITE_STRIPE_TEST_PUBLISHABLE_KEY : env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY),
        'process.env.STRIPE_MODE': JSON.stringify(useStripeTestKeys ? 'test' : 'live'),
        'process.env.IS_PRODUCTION': isProduction
      },
        publicDir: 'public',
        base: command === 'serve' ? '' : '/',
        build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
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
          return `${extType}/[name][extname];`}
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
        '/api': {target: 'http://crystalkeepsakes:8888',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    },
      hmr: {
        protocol: 'ws',
        clientPort: 5174
      }
    }
  };
});
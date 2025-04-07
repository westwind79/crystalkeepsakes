import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'
import { products } from './src/data/products.js' // Using your exact import path

// Copy function for API folder - unchanged except for adding products
const copyAPI = () => ({
  name: 'copy-api',
  closeBundle: async () => {
    // Your existing copy operations
    await fs.ensureDir('dist');
    await fs.copy('api', 'dist/api');
    await fs.copy('config', 'dist/config');
    await fs.copy('.htaccess', 'dist/.htaccess');
    await fs.copy('robots.txt', 'dist/robots.txt');

    // Your original routes
    const routePaths = ['/', '/products', '/about', '/contact', '/faq', '/cart', '/order-confirmation'];
    
    // Generate product paths
    const productPaths = products.map(product => `/product/${product.slug}`);
    
    // Combine all paths
    const allPaths = [...routePaths, ...productPaths];

    // Generate sitemap.xml
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allPaths.map(path => `
          <url>
            <loc>https://www.yourdomain.com${path}</loc>
            <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>${path === '/' ? '1.0' : '0.8'}</priority>
          </url>
        `).join('')}
      </urlset>`;

    await fs.writeFile('dist/sitemap.xml', sitemapContent);

    // Your existing index.html copying logic
    const indexHtml = await fs.readFile('dist/index.html', 'utf8');
    for (const route of allPaths) {
      const routePath = path.join('dist', route);
      await fs.ensureDir(routePath);
      await fs.writeFile(path.join(routePath, 'index.html'), indexHtml);
    }
    
    await fs.writeFile('dist/404.html', indexHtml);
  }
})

// Rest of your config remains EXACTLY as you wrote it
export default defineConfig(({ command }) => {
  const isProduction = command !== 'serve';
  
  return {
    plugins: [
      react(),
      copyAPI()
    ],    
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
        }
      },
      hmr: {
        protocol: 'ws',
        clientPort: 5173
      }
    }
  };
});
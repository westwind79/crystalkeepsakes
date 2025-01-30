import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'

// Copy function for API folder
const copyAPI = () => ({
  name: 'copy-api',
  closeBundle: async () => {
    await fs.ensureDir('dist')    
    // Copy API folder
    await fs.copy('api', 'dist/api')    
    // Copy .htaccess file to specific path
    await fs.copy('.htaccess', path.join('dist', '.htaccess'))
  }
})

// https://vite.dev/config/
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
          // Chunk files for better caching
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            bootstrap: ['bootstrap', 'react-bootstrap']
          },
          assetFileNames: (assetInfo) => {
            // Keep the original folder structure for assets
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
        usePolling: true, // Important for some Windows setups
        interval: 100 // Polling interval in ms
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8888', // MAMP's Apache server
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''), // Strips '/api' prefix
        }
      },
      hmr: {
        protocol: 'ws',
        clientPort: 5173
      }
    }
  };
});
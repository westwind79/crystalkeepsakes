import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs-extra'
import path from 'path'

// Copy function for API folder
const copyAPI = () => ({
  name: 'copy-api',
  closeBundle: async () => {
<<<<<<< HEAD
    await fs.ensureDir('dist');
    await fs.copy('api', 'dist/api');
    await fs.copy('.htaccess', 'dist/.htaccess');
=======
    await fs.ensureDir('dist')    
    // Copy API folder
    await fs.copy('api', 'dist/api')    
    await fs.copy('config', 'dist/config')
    // Copy .htaccess file to specific path
    await fs.copy('.htaccess', path.join('dist', '.htaccess'))
>>>>>>> bc7c1a84381e0589a0b741510e6f25bbb360fb5b
  }
})

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
        }
      },
      hmr: {
        protocol: 'ws',
        clientPort: 5173
      }
    }
  };
});
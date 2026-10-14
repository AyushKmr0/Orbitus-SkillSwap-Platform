import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const backendUrl = env.VITE_BACKEND_URL || 'https://orbitus-skillswap-platform.onrender.com';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 600,
      modulePreload: {
        resolveDependencies(filename, deps) {
          return deps.filter(
            dep =>
              !dep.includes('vendor-charts') &&
              !dep.includes('vendor-motion') &&
              !dep.includes('vendor-socket')
          );
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
                return 'vendor-socket';
              }
              if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                return 'vendor-charts';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@reduxjs') || id.includes('react-redux')) {
                return 'vendor-redux';
              }
              if (
                id.includes('/react/') ||
                id.includes('/react-dom/') ||
                id.includes('/react-router/') ||
                id.includes('/react-router-dom/') ||
                id.includes('\\react\\') ||
                id.includes('\\react-dom\\') ||
                id.includes('\\react-router\\') ||
                id.includes('\\react-router-dom\\')
              ) {
                return 'vendor-react';
              }
              return 'vendor-utils';
            }
          }
        }
      }
    }
  };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-navigation-menu', '@radix-ui/react-dropdown-menu', '@radix-ui/react-dialog'],
          'icons-vendor': ['@heroicons/react', 'lucide-react'],
          'utils-vendor': ['framer-motion', 'clsx', 'class-variance-authority'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/go': {
        target: process.env.VITE_API_BASE || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});

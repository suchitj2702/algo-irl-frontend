import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Sentry plugin for source map upload (production only)
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG || 'algoirl',
      project: process.env.SENTRY_PROJECT || 'frontend',
      telemetry: false,
      sourcemaps: {
        assets: './dist/**',
        filesToDeleteAfterUpload: ['**/*.map'], // Clean up source maps after upload
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Generate source maps for Sentry (hidden from end users)
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separates large libraries
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          'markdown': ['react-markdown'],
          'sentry': ['@sentry/react'], // Separate Sentry chunk
        },
      },
    },
    // Increase chunk size warning limit to 1000 kB (optional, to reduce warnings)
    chunkSizeWarningLimit: 1000,
  },
})

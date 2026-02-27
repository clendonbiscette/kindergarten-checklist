import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/logo.png'],
      manifest: {
        name: 'OHPC Kindergarten Assessment',
        short_name: 'OHPC Assess',
        description: 'Kindergarten assessment checklist for OECS schools',
        theme_color: '#1E3A5F',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/images/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/images/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/images/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Mutating assessment requests — BackgroundSync retries after reconnect
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/api/assessments') &&
              ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'assessment-sync-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 hours in minutes
                },
              },
            },
          },
          {
            // All other API reads — NetworkFirst with cache fallback
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Only precache JS/CSS/HTML — do NOT precache all assets generically
        // This prevents stale chunk references after redeployment
        globPatterns: ['**/*.{html,webmanifest}', 'assets/*.{js,css}'],
        // Prevent the SW from intercepting requests for JS/CSS assets
        // and returning HTML (which causes the MIME type error)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          // Don't intercept any /assets/* requests — let the network handle them
          /^\/assets\//,
          /^\/registerSW\.js$/,
          /^\/sw\.js$/,
          /\.js$/,
          /\.css$/,
          /\.png$/,
          /\.svg$/,
          /\.ico$/,
          /\.webmanifest$/,
        ],
        runtimeCaching: [
          {
            // JS/CSS assets with hash — NetworkFirst to always get fresh files
            urlPattern: /\/assets\/.+\.(js|css)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'assets-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'FORMA Fitness & Workout Tracker',
        short_name: 'FORMA',
        description: 'Track your workouts, routines, nutrition, and body progression everywhere with FORMA.',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ],
        shortcuts: [
          {
            name: "Start Today's Workout",
            short_name: "Start Workout",
            description: "Jump straight into today's gym workout session",
            url: "/?shortcut=start-workout",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Log +500ml Water",
            short_name: "+500ml Water",
            description: "Instantly record 500ml of hydration",
            url: "/?shortcut=water-500",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "AI Meal Scanner",
            short_name: "Scan Meal",
            description: "Scan meal picture with AI camera to track macros",
            url: "/nutrition?action=scan-meal",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      }
    })
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: false,
    host: host || true,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('@google/genai')) return 'vendor-gemini';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('framer-motion')) return 'vendor-framer';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('date-fns')) return 'vendor-date-fns';
        }
      }
    }
  }
}));

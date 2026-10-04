import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/test-utils',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  imports: {
    autoImport: false
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      appName: 'Malta Calendar',
      adminEmail: 'pierre.reynaud@outlook.com'
    }
  },

  routeRules: {
    '/': {
      prerender: true,
      headers: {
        'cache-control': 'no-cache'
      }
    },
    '/sw.js': {
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate'
      }
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        semi: true,
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Malta Calendar',
      short_name: 'Malta',
      description: 'Calendrier de septembre pour nourrir Malta, le chat gris et blanc.',
      theme_color: '#7D7A72',
      background_color: '#F7F1E8',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      lang: 'fr',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      // The plugin defaults to serving a precached index.html for every
      // navigation. That keeps the previous HTML on the phone after a deploy.
      // undefined drops that fallback. Navigations use the network, and the
      // last successful page is only a fallback when the network fails.
      navigateFallback: undefined,
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,png,svg,ico,txt,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'html-pages',
            expiration: {
              maxEntries: 8,
              maxAgeSeconds: 60 * 60 * 24
            },
            cacheableResponse: {
              statuses: [200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      type: 'module'
    }
  },

  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/login', '/confirm']
    }
  }
});

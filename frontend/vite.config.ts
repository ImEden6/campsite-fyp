// vite.config.ts
// configures the vite(npm) build tool for the frontend
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Plugin to exclude dev dependencies from production builds
  const excludeDevDepsPlugin = (): Plugin => {
    return {
      name: 'exclude-dev-deps',
      enforce: 'pre' as const,
      resolveId(id) {
        // In production, exclude dev dependencies
        if (mode === 'production') {
          if (id.includes('@vite/client') || 
              id.includes('@react-refresh') || 
              id.includes('/@vite/') ||
              id.includes('/@react-refresh')) {
            // Return a virtual module that does nothing
            return { id: '\0dev-dependency-excluded', external: true };
          }
        }
        return null;
      },
    };
  };
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Plugin to optimize HTML: make CSS non-render-blocking and defer service worker
  const htmlOptimizePlugin = (): Plugin => {
    return {
      name: 'html-optimize',
      enforce: 'post' as const,
      transformIndexHtml(html) {
        let transformed = html;
        
        // Transform CSS links to non-render-blocking pattern
        // Match: <link rel="stylesheet" ... href="/assets/index-XXXX.css" ...>
        // Skip if already has onload or is inside noscript
        transformed = transformed.replace(
          /<link\s+rel=["']stylesheet["']([^>]*?)href=["']([^"']*?\.css)["']([^>]*?)>/gi,
          (match, beforeHref, href, afterHref) => {
            // Skip if already has onload (already transformed) or is inside noscript
            if (match.includes('onload=') || match.includes('noscript')) {
              return match;
            }
            // Skip if it's already a preload
            if (match.includes('rel=["\']preload["\']')) {
              return match;
            }
            // Skip font CSS files (already handled in index.html)
            if (href.includes('/fonts/')) {
              return match;
            }
            // Create preload + stylesheet pattern
            return `<link rel="preload" as="style" href="${href}"${beforeHref}${afterHref}>
    <link rel="stylesheet" href="${href}"${beforeHref} media="print" onload="this.media='all'"${afterHref}>
    <noscript><link rel="stylesheet" href="${href}"${beforeHref}${afterHref}></noscript>`;
          }
        );
        
        return transformed;
      },
      writeBundle(options, bundle) {
        // Post-process the HTML file after all plugins have run
        if (options.dir) {
          const htmlPath = join(options.dir, 'index.html');
          
          if (existsSync(htmlPath)) {
            let html = readFileSync(htmlPath, 'utf-8');
            
            // Move service worker script to end of body
            // Use [\s\S] instead of . with 's' flag for ES2018 compatibility
            const swScriptRegex = /<script[^>]*id\s*=\s*["']vite-plugin-pwa:register-sw["'][^>]*>[\s\S]*?<\/script>/i;
            let swScript = html.match(swScriptRegex)?.[0];
            
            if (!swScript) {
              swScript = html.match(/<script[^>]*id\s*=\s*["']vite-plugin-pwa:register-sw["'][^>]*\/>/i)?.[0];
            }
            
            if (swScript) {
              // Remove script from anywhere
              html = html.replace(swScriptRegex, '');
              html = html.replace(/<script[^>]*id\s*=\s*["']vite-plugin-pwa:register-sw["'][^>]*\/>/i, '');
              // Clean up
              html = html.replace(/(<link[^>]*manifest[^>]*>)\s*(<\/head>)/i, '$2');
              // Add to end of body
              html = html.replace(/<\/body>/i, `  ${swScript}\n</body>`);
              writeFileSync(htmlPath, html, 'utf-8');
            }
          }
        }
      },
    };
  };
  
  return {
    plugins: [
      // Exclude dev dependencies plugin (must be first)
      ...(mode === 'production' ? [excludeDevDepsPlugin()] : []),
      react({
        // Exclude test files from React plugin processing
        exclude: /\.test\.(ts|tsx)$/,
        // JSX runtime - use automatic runtime for better tree-shaking
        jsxRuntime: 'automatic',
      }),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
        manifest: {
          name: 'Campsite Management System',
          short_name: 'Campsite',
          description: 'Comprehensive campsite management system for managing bookings, payments, and operations',
          theme_color: '#10b981',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'New Booking',
              short_name: 'Book',
              description: 'Create a new booking',
              url: '/book',
              icons: [{ src: '/icons/shortcut-booking.png', sizes: '96x96' }]
            },
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'View dashboard',
              url: '/dashboard',
              icons: [{ src: '/icons/shortcut-dashboard.png', sizes: '96x96' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.campsite\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
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
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      }),
      // HTML optimization plugin (runs after VitePWA to transform its output)
      htmlOptimizePlugin()
    ],
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@features': resolve(__dirname, './src/features'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@stores': resolve(__dirname, './src/stores'),
        '@services': resolve(__dirname, './src/services'),
        '@types': resolve(__dirname, './src/types'),
        '@config': resolve(__dirname, './src/config'),
        '@assets': resolve(__dirname, './src/assets'),
        '@styles': resolve(__dirname, './src/styles'),
        '@shared': resolve(__dirname, '../shared'),
      },
      // Prevent mis-matched React copies when working inside the monorepo
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    },
    
    server: {
      port: 3000,
      host: true,
      open: false,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/socket.io': {
          target: env.VITE_WS_URL || 'ws://localhost:5000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    
    build: {
      outDir: 'dist',
      // Production optimizations (mode is determined by build command)
      sourcemap: mode !== 'production',
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        // Tree-shaking configuration - aggressive tree-shaking for production
        treeshake: undefined,
        output: {
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `assets/js/[name]-[hash].js`;
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          // Manual chunk splitting for better code splitting of heavy libraries
          manualChunks: (id) => {
            // React vendor chunk
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router')) {
              return 'react-vendor';
            }
            // UI vendor chunk (framer-motion, lucide-react)
            if (id.includes('node_modules/framer-motion') || 
                id.includes('node_modules/lucide-react')) {
              return 'ui-vendor';
            }
            // Canvas vendor chunk (konva, react-konva)
            if (id.includes('node_modules/konva') || 
                id.includes('node_modules/react-konva')) {
              return 'canvas-vendor';
            }
            // Chart vendor chunk (recharts)
            if (id.includes('node_modules/recharts')) {
              return 'chart-vendor';
            }
          },
        },
      },
      // Minification - use terser for better compression in production
      minify: mode === 'production' ? 'terser' : 'esbuild',
      // Terser options for optimal minification
      ...(mode === 'production' && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
            passes: 3, // Multiple passes for better compression
          },
          format: {
            comments: false,
          },
        },
      }),
      // esbuild options for development or fallback
      ...(mode !== 'production' && {
        esbuildOptions: {
          legalComments: 'inline',
        },
      }),
      // CSS code splitting
      cssCodeSplit: true,
      // CSS minification - use esbuild for production (lightningcss requires separate plugin)
      cssMinify: mode === 'production' ? 'esbuild' : false,
      // Asset inlining threshold (reduce to 4kb for better initial load)
      assetsInlineLimit: 4096,
      // Report compressed size
      reportCompressedSize: true,
      // Target modern browsers for smaller bundles
      target: 'esnext',
      // Module preload polyfill
      modulePreload: {
        polyfill: false, // Modern browsers support module preload
      },
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'zustand',
        '@tanstack/react-query',
        'hoist-non-react-statics', // CommonJS module that needs to be pre-bundled
      ],
      // Exclude heavy libraries from pre-bundling - let them be code-split
      exclude: [
        'framer-motion', // Lazy load when needed
        'react-konva',
        'konva', // Heavy canvas library - lazy load
        'recharts', // Heavy chart library - lazy load
        'socket.io-client', // Only load when needed
        '@sentry/react', // Lazy load Sentry - don't include in initial bundle
        'lucide-react', // Code-split for better initial load performance
      ],
      // Force esbuild to optimize with better tree-shaking
      esbuildOptions: {
        target: 'esnext',
        treeShaking: true,
      },
    },
    
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'Campsite Management'),
      // Exclude dev code in production
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      // Remove dev-only code
      __DEV__: mode !== 'production',
    },
    
    // Preview server configuration
    preview: {
      port: 3000,
      host: true,
    },
    
    // Test configuration
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/tests/setup.ts',
      css: true,
      // Exclude Playwright e2e tests from Vitest
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/tests/e2e/**', // Exclude Playwright tests
        '**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      ],
      // esbuild options for test transformation
      // Ensures esbuild can properly transform TypeScript/TSX files during tests
      esbuild: {
        target: 'node18',
      },
    },
  }
})

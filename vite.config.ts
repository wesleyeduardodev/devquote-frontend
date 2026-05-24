import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: [
                'favicon.ico',
                'apple-touch-icon-180x180.png',
                'icon-source.svg',
            ],
            manifest: {
                name: 'DevQuote',
                short_name: 'DevQuote',
                description: 'Gestão de tarefas, entregas e faturamento para times de desenvolvimento.',
                lang: 'pt-BR',
                dir: 'ltr',
                theme_color: '#4F5EE6',
                background_color: '#0F1115',
                display: 'standalone',
                display_override: ['window-controls-overlay', 'standalone', 'browser'],
                orientation: 'any',
                scope: '/',
                start_url: '/',
                id: '/',
                categories: ['business', 'productivity'],
                icons: [
                    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
                    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
                // SPA fallback: qualquer navegação não cacheada cai no index.html
                // (React Router resolve o routing client-side). Antes estava
                // apontando pro /offline.html, o que fazia F5 em /tasks, /billing
                // etc. mostrar "Sem conexão" mesmo com rede OK.
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api\//, /^\/offline\.html$/],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        // Chamadas à API: rede primeiro, cache só pra fallback rápido offline (5min)
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 5,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // Imagens: cache first com revalidação
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                    {
                        // Fontes do Google ou CDNs (se houver)
                        urlPattern: ({ url }) =>
                            url.origin === 'https://fonts.googleapis.com' ||
                            url.origin === 'https://fonts.gstatic.com',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'google-fonts',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
    server: {
        port: 3000,
        open: true,
        host: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
})

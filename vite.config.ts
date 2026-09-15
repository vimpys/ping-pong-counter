import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    // PWA: ติดตั้งเป็นแอปบน Mac / คอม / มือถือได้จากเว็บ และใช้ได้แม้ไม่มีเน็ต
    VitePWA({
      // ไม่ลงทะเบียนอัตโนมัติ — main.ts ลงทะเบียนเองเฉพาะบนเว็บ (ไม่ใช่ในแอป Capacitor)
      injectRegister: false,
      // มีเวอร์ชันใหม่ → ใช้ตอนเปิดแอปครั้งถัดไป (ไม่รีโหลดกลางเกม)
      registerType: 'prompt',
      manifest: {
        id: '/',
        name: 'Ping Pong Counter',
        short_name: 'ปิงปอง',
        description: 'นับแต้มปิงปอง จัดคิวผู้เล่นในก๊วน',
        lang: 'th',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fff6fa',
        theme_color: '#fff6fa',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // woff2 พอ (เบราว์เซอร์ที่รองรับ PWA อ่าน woff2 ได้หมด)
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

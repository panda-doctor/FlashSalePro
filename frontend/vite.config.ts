/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8090'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      allowedHosts: true,
      proxy: {
        // 会话 Cookie 为 SameSite=Strict 且 Path=/api，浏览器必须同源访问，统一走代理
        '/api': { target: proxyTarget, changeOrigin: false },
        '/uploads': { target: proxyTarget, changeOrigin: false },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: true,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: false },
        '/uploads': { target: proxyTarget, changeOrigin: false },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            'element-plus': ['element-plus'],
          },
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      reporters: 'default',
    },
  }
})

/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import ElementPlus from 'unplugin-element-plus/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8090'

  return {
    plugins: [
      vue(),
      // 显式 import { ElMessage } 等 API 时自动补样式（unplugin-vue-components 只管模板组件）
      ElementPlus({ useSource: false }),
      Components({
        resolvers: [ElementPlusResolver({ importStyle: 'css' })],
        dts: 'src/components.d.ts',
      }),
    ],
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
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // 只固定框架层分包；Element Plus 交给 Rollup 按路由动态 import 自动切分，
          // 否则所有组件会被塞进同一个 chunk，首屏被迫下载管理台才用到的表格/日期选择器。
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (/node_modules\/(@vue|vue|vue-router|pinia)\//.test(id)) return 'vue'
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

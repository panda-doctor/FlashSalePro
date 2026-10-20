import { defineConfig, devices } from '@playwright/test'

/**
 * E2E 配置：默认复用已在 5173 运行的 Vite dev server，并经由 Vite 代理访问网关 8090。
 * 若需测试独立环境，设置 E2E_BASE_URL；Chromium 版本不匹配时可用 E2E_CHROME_PATH 指定可执行文件。
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173'
const chromePath = process.env.E2E_CHROME_PATH

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    locale: 'zh-CN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: chromePath ? { executablePath: chromePath } : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5173',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

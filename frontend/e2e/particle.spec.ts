import { expect, test } from '@playwright/test'

const routes = ['/', '/products', '/activities', '/login', '/ai-support', '/admin']

test.describe('Trust Light 粒子背景', () => {
  test('固定粒子层存在、不可聚焦且不拦截指针', async ({ page }) => {
    await page.goto('/')

    const field = page.locator('.particle-field')
    await expect(field).toHaveCount(1)
    await expect(field).toHaveAttribute('aria-hidden', 'true')
    await expect(field.locator('canvas')).toHaveCount(1)

    const styles = await field.evaluate((node) => {
      const computed = getComputedStyle(node)
      return {
        position: computed.position,
        pointerEvents: computed.pointerEvents,
        zIndex: computed.zIndex,
        background: computed.backgroundColor,
      }
    })
    expect(styles.position).toBe('fixed')
    expect(styles.pointerEvents).toBe('none')
    expect(styles.zIndex).toBe('0')
    // 浅色主题下粒子层透明，近白画布由 body 提供
    expect(styles.background).toBe('rgba(0, 0, 0, 0)')

    // 冷色配色通过 CSS 变量集中暴露，便于整体换肤
    const palette = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      return {
        toneA: root.getPropertyValue('--particle-tone-1').trim(),
        toneB: root.getPropertyValue('--particle-tone-2').trim(),
        glow: root.getPropertyValue('--particle-glow').trim(),
      }
    })
    expect(palette.toneA).toBe('37, 99, 235')
    expect(palette.toneB).toBe('99, 102, 241')
    expect(palette.glow).toContain('rgba(29, 78, 216')

    const canvasBox = await field.locator('canvas').boundingBox()
    expect(canvasBox?.width ?? 0).toBeGreaterThan(0)
    expect(canvasBox?.height ?? 0).toBeGreaterThan(0)

    // 粒子层覆盖全屏，但主内容仍可点击
    await page.getByRole('link', { name: '进入活动大厅' }).click()
    await expect(page).toHaveURL(/\/activities/)
  })

  test('关键路由共享同一粒子层且无横向滚动', async ({ page }) => {
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('.particle-field')).toHaveCount(1)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `路由 ${route} 出现横向滚动`).toBeLessThanOrEqual(1)
    }
  })
})

test.describe('reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('偏好减弱动画时只保留静态帧', async ({ page }) => {
    await page.goto('/')
    const canvas = page.locator('.particle-field canvas')
    await expect(canvas).toBeVisible()

    // 等待 ResizeObserver 的 150ms 防抖重排完成后，再进行两次采样
    await page.waitForTimeout(800)
    const first = await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL())
    await page.waitForTimeout(600)
    const second = await canvas.evaluate((node) => (node as HTMLCanvasElement).toDataURL())

    expect(first).toBe(second)
    expect(first.length).toBeGreaterThan(1000)
  })
})

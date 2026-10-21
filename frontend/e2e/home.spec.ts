import { expect, test } from '@playwright/test'

test.describe('首页落地页', () => {
  test('呈现六个叙事区块与唯一的 H1', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('稀缺之物')

    for (const heading of [
      /高端甄选/,
      /限时秒杀/,
      /三章，讲清一次/,
      /克制的界面/,
      /专属会籍/,
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    }

    await expect(page.locator('#story')).toBeVisible()
  })

  test('主 CTA 进入活动大厅，锚点进入品牌故事', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: '进入活动大厅' }).click()
    await expect(page).toHaveURL(/\/activities$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('秒杀活动')

    await page.goto('/')
    await page.getByRole('link', { name: '阅读品牌故事' }).click()
    await expect(page).toHaveURL(/\/#story$/)
    await expect(page.locator('#story')).toBeInViewport()
  })

  test('未登录时会员入口分流到注册与登录', async ({ page }) => {
    await page.goto('/')

    const membership = page.locator('section[aria-labelledby="membership-heading"]')
    await expect(membership.getByRole('link', { name: '创建账户' })).toBeVisible()
    await expect(membership.getByRole('link', { name: /已有账户，登录/ })).toBeVisible()

    await membership.getByRole('link', { name: '创建账户' }).click()
    await expect(page).toHaveURL(/\/register$/)
  })

  for (const viewport of [
    { width: 375, height: 812, label: '移动端' },
    { width: 768, height: 1024, label: '平板' },
    { width: 1440, height: 900, label: '桌面' },
  ]) {
    test(`${viewport.label} ${viewport.width}px 无横向滚动`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect(page.locator('footer')).toBeInViewport()
    })
  }

  test('顶栏在首页顶部透明，滚动后转为白色玻璃', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('header').first()

    await page.waitForFunction(() => window.scrollY === 0)
    const transparentValue = await header.evaluate((node) => getComputedStyle(node).backgroundColor)
    expect(transparentValue).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)

    // 使用瞬时滚动，避免 html 的 smooth 缓动在负载高时拖慢断言
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }))
    await page.waitForFunction(() => window.scrollY >= 399)
    // 背景色过渡 220ms，用自动重试的断言代替固定等待，避免高负载下抖动
    await expect(header).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.9)')
  })
})

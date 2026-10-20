import { expect, test } from '@playwright/test'

test.describe('商品', () => {
  test('列表 → 搜索防抖 → 详情', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: '商品货架' })).toBeVisible()

    const cards = page.locator('a[href^="/products/"]')
    await expect(cards.first()).toBeVisible()
    const initialCount = await cards.count()
    expect(initialCount).toBeGreaterThan(0)

    // 输入即搜：防抖 300ms 后应只剩键盘相关商品
    await page.getByPlaceholder('输入商品名称后回车或点击查询').fill('键盘')
    await expect
      .poll(async () => cards.count(), { timeout: 8_000 })
      .toBeLessThan(initialCount)
    await expect(cards.first()).toContainText('键盘')

    await cards.first().click()
    await expect(page).toHaveURL(/\/products\/\d+/)
    await expect(page.getByRole('heading', { name: /键盘/ }).first()).toBeVisible()
    await expect(page.getByText('商品描述')).toBeVisible()
  })

  test('搜索无结果展示空态', async ({ page }) => {
    await page.goto('/products')
    await page.getByPlaceholder('输入商品名称后回车或点击查询').fill('不存在的商品关键字zzz')
    await expect(page.getByText(/没有找到|暂无商品/)).toBeVisible({ timeout: 8_000 })
  })
})

import { expect, test } from '@playwright/test'
import { createProductWithoutImage, deactivateProduct } from './support/api'

test.describe('商品', () => {
  test('列表 → 搜索防抖 → 详情', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: '商品货架' })).toBeVisible()

    const cards = page.locator('a[href^="/products/"]')
    await expect(cards.first()).toBeVisible()
    const initialCount = await cards.count()
    // 固定每页 4 件，页大小下拉已移除
    expect(initialCount).toBe(4)
    await expect(page.locator('#product-page-size')).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: '商品分页' })).toContainText('第 1–4 件')

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

  test('固定每页 4 件，翻页更新区间并回到目录顶部', async ({ page }) => {
    await page.goto('/products')

    const cards = page.locator('a[href^="/products/"]')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBe(4)

    const firstHref = await cards.first().getAttribute('href')
    const pager = page.getByRole('navigation', { name: '商品分页' })
    await pager.locator('.el-pager li').nth(1).click()

    await expect(pager).toContainText('第 5–8 件')
    await expect(cards.first()).not.toHaveAttribute('href', firstHref ?? '')
    expect(await cards.count()).toBe(4)

    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(200)

    // 末页不足 4 件时卡片自动放大铺满整行，右侧不留空列
    await pager.locator('.el-pager li').last().click()
    await expect(pager).toContainText('第 9–10 件')
    await expect(cards).toHaveCount(2)
    const columns = await page
      .locator('main .grid.gap-5')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(columns).toBe(2)
  })

  test('搜索无结果展示空态', async ({ page }) => {
    await page.goto('/products')
    await page.getByPlaceholder('输入商品名称后回车或点击查询').fill('不存在的商品关键字zzz')
    await expect(page.getByText(/没有找到|暂无商品/)).toBeVisible({ timeout: 8_000 })
  })

  test('商品路由复用全站浅色壳层', async ({ page }) => {
    await page.goto('/products')

    await expect(page.getByRole('note', { name: '服务公告' })).toHaveCount(0)
    await expect(page.getByRole('banner')).toHaveClass(/fixed/)
    await expect(page.getByRole('banner')).not.toHaveClass(/product-nav/)
    await expect(page.getByRole('link', { name: '商品', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Warm drops, precise execution.')).toBeVisible()

    // 顶部搜索框沿用全站冷灰边框
    const searchBorder = await page
      .locator('#global-search')
      .locator('..')
      .evaluate((el) => getComputedStyle(el).borderTopColor)
    expect(searchBorder).toBe('rgb(228, 233, 240)')

    // 商品页底色透出 canvas 与粒子层，不再铺不透明亮底
    const pageBackground = await page
      .locator('.product-page')
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(pageBackground).toBe('rgba(0, 0, 0, 0)')

    const bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bodyBackground).toBe('rgb(251, 252, 253)')
  })

  test('详情标签页支持点击与方向键切换', async ({ page }) => {
    await page.goto('/products')
    await page.locator('a[aria-label^="查看商品"]').first().click()
    await expect(page).toHaveURL(/\/products\/\d+/)

    const stockTab = page.getByRole('tab', { name: '库存说明' })
    await stockTab.click()
    await expect(stockTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText('总库存')

    await stockTab.focus()
    await page.keyboard.press('ArrowRight')
    const seckillTab = page.getByRole('tab', { name: '秒杀说明' })
    await expect(seckillTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText('Redis')

    await page.keyboard.press('Home')
    await expect(page.getByRole('tab', { name: '商品描述' })).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('End')
    await expect(seckillTab).toHaveAttribute('aria-selected', 'true')
  })

  test('无图商品展示耳机示意图与可切换配色', async ({ page }) => {
    const product = await createProductWithoutImage({ totalStock: 12 })
    try {
      await page.goto(`/products/${product.productId}`)

      await expect(page.getByRole('heading', { name: product.name })).toBeVisible()
      await expect(page.getByText('商品示意图', { exact: true })).toBeVisible()
      const stage = page.getByTestId('product-gallery-stage')
      await expect(stage.getByRole('img', { name: /赤陶配色头戴式耳机/ })).toBeVisible()

      const amber = page.getByRole('button', { name: '琥珀配色预览', exact: true })
      await amber.click()
      await expect(amber).toHaveAttribute('aria-pressed', 'true')
      await expect(stage.getByRole('img', { name: /琥珀配色头戴式耳机/ })).toBeVisible()

      const related = page.locator('section[aria-labelledby="related-heading"]')
      await expect(related.getByRole('heading', { name: '更多精选' })).toBeVisible()
      const cards = related.locator('a[aria-label^="查看商品"]')
      await expect(cards.first()).toBeVisible()
      expect(await cards.count()).toBeLessThanOrEqual(4)

      const hrefs = await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))
      expect(hrefs).not.toContain(`/products/${product.productId}`)
    } finally {
      await deactivateProduct(product.productId)
    }
  })

  test('375 / 768 / 1440 三档视口无横向滚动', async ({ page }) => {
    const product = await createProductWithoutImage({ totalStock: 20 })

    try {
      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 })

        await page.goto('/products')
        await expect(page.getByRole('heading', { name: '商品货架' })).toBeVisible()
        await expect(page.locator('a[aria-label^="查看商品"]').first()).toBeVisible()

        const listOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(listOverflow, `${width}px 商品列表不应横向滚动`).toBeLessThanOrEqual(1)

        const columns = await page
          .locator('main .grid.gap-5')
          .first()
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
        const expected = width >= 1024 ? 4 : width >= 640 ? 2 : 1
        expect(columns, `${width}px 商品网格列数`).toBe(expected)

        await page.goto(`/products/${product.productId}`)
        await expect(page.getByRole('heading', { name: product.name })).toBeVisible()

        const detailOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(detailOverflow, `${width}px 商品详情不应横向滚动`).toBeLessThanOrEqual(1)

        const detailColumns = await page
          .locator('article .grid')
          .first()
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
        expect(detailColumns, `${width}px 详情双栏断点`).toBe(width >= 960 ? 2 : 1)

        if (width < 600) {
          const cta = await page.locator('article a.product-cta').boundingBox()
          const ghost = await page.locator('article a.product-ghost').boundingBox()
          expect(cta).not.toBeNull()
          expect(ghost).not.toBeNull()
          expect(ghost!.y).toBeGreaterThan(cta!.y)
        }
      }
    } finally {
      await deactivateProduct(product.productId)
    }
  })
})

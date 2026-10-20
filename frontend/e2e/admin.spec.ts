import { expect, test } from '@playwright/test'
import { ADMIN_TOKEN } from './support/api'

test.describe('管理台', () => {
  test('错误令牌被拒绝，正确令牌进入经营看板并可切换各页', async ({ page }) => {
    await page.goto('/admin')

    const tokenInput = page.getByPlaceholder('输入后端配置的 ADMIN_TOKEN')
    await expect(tokenInput).toBeVisible()

    await tokenInput.fill('wrong-token')
    await page.getByRole('button', { name: '校验并进入' }).click()
    await expect(page.getByText(/令牌无效|校验失败/)).toBeVisible({ timeout: 10_000 })

    await tokenInput.fill(ADMIN_TOKEN)
    await page.getByRole('button', { name: '校验并进入' }).click()

    // 默认落地经营看板（KPI + 趋势 + Top5）
    await expect(page.getByRole('heading', { level: 2, name: '经营看板' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('今日订单')).toBeVisible()
    await expect(page.getByRole('heading', { name: '成交趋势' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '活动 Top5' })).toBeVisible()
    await expect(page.locator('svg[aria-label="每日订单数趋势"]')).toBeVisible()

    // 活动运维：列表 + 筛选 + 新建
    await page.goto('/admin/activities')
    await expect(page.getByRole('heading', { level: 2, name: '活动运维' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('活动名称')).toBeVisible()
    await expect(page.getByRole('button', { name: '新建活动' })).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 15_000 })

    // 商品管理：全量列表 + 上下架入口
    await page.goto('/admin/products')
    await expect(page.getByRole('heading', { level: 2, name: '商品管理' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('商品名称')).toBeVisible()
    await expect(page.getByRole('button', { name: '新建商品' })).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 15_000 })

    // 订单管理：四条件筛选
    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { level: 2, name: '订单管理' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('订单号')).toBeVisible()
    await expect(page.getByLabel('活动 ID')).toBeVisible()
    await expect(page.getByLabel('用户 ID')).toBeVisible()
    await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 15_000 })

    // 死信管理：列表 + 批量重放入口
    await page.goto('/admin/dead-letters')
    await expect(page.getByRole('heading', { level: 2, name: '死信管理' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /批量重放/ })).toBeVisible()

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { level: 2, name: '用户管理' })).toBeVisible({ timeout: 15_000 })
  })
})

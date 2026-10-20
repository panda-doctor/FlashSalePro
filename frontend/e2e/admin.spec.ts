import { expect, test } from '@playwright/test'
import { ADMIN_TOKEN } from './support/api'

test.describe('管理台', () => {
  test('错误令牌被拒绝，正确令牌进入商品管理', async ({ page }) => {
    await page.goto('/admin')

    const tokenInput = page.getByPlaceholder('输入后端配置的 ADMIN_TOKEN')
    await expect(tokenInput).toBeVisible()

    await tokenInput.fill('wrong-token')
    await page.getByRole('button', { name: '校验并进入' }).click()
    await expect(page.getByText(/令牌无效|校验失败/)).toBeVisible({ timeout: 10_000 })

    await tokenInput.fill(ADMIN_TOKEN)
    await page.getByRole('button', { name: '校验并进入' }).click()

    await expect(page.getByRole('heading', { level: 2, name: '商品管理' })).toBeVisible({ timeout: 15_000 })
    // 管理端没有商品列表接口，页面是「按 ID 查询 + 新建」而非表格
    await expect(page.getByRole('button', { name: '新建商品' })).toBeVisible()

    // 活动运维与用户管理可切换
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { level: 2, name: '用户管理' })).toBeVisible({ timeout: 15_000 })

    await page.goto('/admin/activities')
    await expect(page.getByRole('heading', { level: 2, name: '活动运维' })).toBeVisible({ timeout: 15_000 })
  })
})

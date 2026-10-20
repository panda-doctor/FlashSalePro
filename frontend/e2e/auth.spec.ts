import { expect, test } from '@playwright/test'
import { uniqueAccount } from './support/api'

test.describe('认证', () => {
  test('注册 → 会话建立 → 我的订单可达 → 重新登录', async ({ page }) => {
    const account = uniqueAccount('auth')
    const password = 'e2eTest@2026'

    await page.goto('/register')
    await page.getByPlaceholder('3-32 位字母、数字、点、下划线或短横线').fill(account)
    await page.getByPlaceholder('展示在右上角，最多 64 个字符').fill('E2E 用户')
    await page.getByPlaceholder('至少 10 位，最多 72 位').fill(password)
    await page.getByPlaceholder('请再次输入密码').fill(password)
    await page.getByRole('button', { name: '注册并登录' }).click()

    await expect(page.getByText('E2E 用户').first()).toBeVisible()
    await expect(page).toHaveURL(/\/$|\/products/)

    // 会话有效：需要登录的页面不被守卫拦回登录页
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: '我的订单' })).toBeVisible()

    // 清会话后重新登录（验证登录链路与密码校验）
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByPlaceholder('例如 flash_user').fill(account)
    await page.getByPlaceholder('请输入密码').fill(password)
    await page.getByPlaceholder('请输入密码').press('Enter')
    await expect(page.getByText('E2E 用户').first()).toBeVisible({ timeout: 15_000 })
  })

  test('无效账号给出表单提示且停留在登录页', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('例如 flash_user').fill('notexistuser1')
    await page.getByPlaceholder('请输入密码').fill('wrongPassword123')
    await page.getByPlaceholder('请输入密码').press('Enter')

    await expect(page.locator('.el-message').first()).toContainText(/账号|密码|错误|失败/, {
      timeout: 15_000,
    })
    await expect(page).toHaveURL(/\/login/)
  })
})

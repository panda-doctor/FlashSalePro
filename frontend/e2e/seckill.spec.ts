import { expect, test } from '@playwright/test'
import { createAndPreheatActivity, resetActivityStock, uniqueAccount } from './support/api'

test.describe('秒杀主链路', () => {
  test('创建并预热 → 登录 → 抢购 → 订单落库', async ({ page }) => {
    test.slow()
    const { activityId } = await createAndPreheatActivity({ stock: 3, priceCents: 199 })

    try {
      // 1. 注册即登录（抢购需要会话）
      const account = uniqueAccount('buy')
      const password = 'e2eTest@2026'
      await page.goto('/register')
      await page.getByPlaceholder('3-32 位字母、数字、点、下划线或短横线').fill(account)
      await page.getByPlaceholder('展示在右上角，最多 64 个字符').fill('抢购用户')
      await page.getByPlaceholder('至少 10 位，最多 72 位').fill(password)
      await page.getByPlaceholder('请再次输入密码').fill(password)
      await page.getByRole('button', { name: '注册并登录' }).click()
      await expect(page.getByText('抢购用户').first()).toBeVisible()

      // 2. 进入进行中的活动并抢购
      await page.goto(`/activities/${activityId}`)
      const buyButton = page.getByRole('button', { name: '立即抢购' })
      await expect(buyButton).toBeEnabled({ timeout: 10_000 })
      await buyButton.click()

      await expect(page.getByText(/已进入队列|订单号/).first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('订单号', { exact: true })).toBeVisible({ timeout: 10_000 })

      // 3. 订单最终落库（Redis Stream → order 消费，最长等 30s）
      await page.goto('/orders')
      await expect(page.getByText('已创建').first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await resetActivityStock(activityId)
    }
  })

  test('重复抢购被拦截', async ({ page }) => {
    test.slow()
    const { activityId } = await createAndPreheatActivity({ stock: 2, priceCents: 199 })

    try {
      const account = uniqueAccount('dup')
      const password = 'e2eTest@2026'
      await page.goto('/register')
      await page.getByPlaceholder('3-32 位字母、数字、点、下划线或短横线').fill(account)
      await page.getByPlaceholder('展示在右上角，最多 64 个字符').fill('重复用户')
      await page.getByPlaceholder('至少 10 位，最多 72 位').fill(password)
      await page.getByPlaceholder('请再次输入密码').fill(password)
      await page.getByRole('button', { name: '注册并登录' }).click()
      // 等注册会话建立后再跳转，否则详情页按钮仍是「登录后抢购」
      await expect(page.getByText('重复用户').first()).toBeVisible({ timeout: 15_000 })

      await page.goto(`/activities/${activityId}`)
      const buyButton = page.getByRole('button', { name: '立即抢购' })
      await expect(buyButton).toBeEnabled({ timeout: 10_000 })
      await buyButton.click()
      await expect(page.getByText('订单号', { exact: true })).toBeVisible({ timeout: 15_000 })

      // 同时越过前端 1s 节流与后端限流窗口，确保命中「重复参与」而不是「请求过于频繁」
      await page.waitForTimeout(2_500)
      await buyButton.click()
      await expect(page.getByText(/请勿重复秒杀|已参与/).first()).toBeVisible({ timeout: 10_000 })
    } finally {
      await resetActivityStock(activityId)
    }
  })
})

import { expect, test } from '@playwright/test'
import { createAndPreheatActivity, resetActivityStock } from './support/api'

test.describe('秒杀活动', () => {
  test('大厅筛选与排序可用，卡片可进入详情', async ({ page }) => {
    // 种子数据不保证有进行中的活动，先造一场再验证筛选
    const { activityId, activityName } = await createAndPreheatActivity({ stock: 5, priceCents: 199 })

    try {
      await page.goto('/activities')
      await expect(page.getByRole('heading', { name: '秒杀活动' })).toBeVisible()

      // 客户端筛选：阶段筛选是 radio-group，标签后带实时计数
      const filterGroup = page.getByRole('group', { name: '活动阶段筛选' })
      await expect(filterGroup).toBeVisible()
      for (const label of ['全部', '进行中', '未开始', '已结束']) {
        await expect(filterGroup.getByRole('radio', { name: new RegExp(`^${label}`) })).toBeVisible()
      }

      // Element Plus 的原生 radio 被隐藏，用户实际点的是外层 label
      await filterGroup.locator('label').filter({ hasText: '进行中' }).click()
      await expect(filterGroup.getByRole('radio', { name: /进行中/ })).toBeChecked()

      const card = page.locator('article').filter({ hasText: activityName })
      await expect(card).toBeVisible({ timeout: 10_000 })

      await card.getByRole('button').click()
      await expect(page).toHaveURL(new RegExp(`/activities/${activityId}$`))
      await expect(page.getByRole('heading', { level: 1, name: activityName })).toBeVisible()
      await expect(page.getByText('抢购榜')).toBeVisible()
    } finally {
      await resetActivityStock(activityId)
    }
  })

  test('不存在的活动展示错误态', async ({ page }) => {
    await page.goto('/activities/123456789')
    await expect(page.getByText(/活动不存在|加载失败/)).toBeVisible({ timeout: 8_000 })
  })
})

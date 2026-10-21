import { expect, test } from '@playwright/test'
import {
  createAndPreheatActivity,
  createUpcomingActivity,
  resetActivityStock,
} from './support/api'

test.describe('秒杀活动', () => {
  test('三区块分组、双区块独立分页与卡片跳转', async ({ page }) => {
    // 种子数据不保证有进行中或未开始的场次，先各造一场再验证分组
    const running = await createAndPreheatActivity({ stock: 5, priceCents: 199 })
    const upcoming = await createUpcomingActivity({ hoursFromNow: 2 })

    try {
      await page.goto('/activities')
      await expect(page.getByRole('heading', { name: '秒杀活动' })).toBeVisible()

      // 顶部锚点导航替代原来的状态筛选胶囊
      const nav = page.getByRole('navigation', { name: '活动区块导航' })
      await expect(nav.getByRole('link', { name: /即将开场/ })).toBeVisible()
      await expect(nav.getByRole('link', { name: /进行中/ })).toBeVisible()
      await expect(nav.getByRole('link', { name: /已结束/ })).toBeVisible()

      // 即将开场：单条轮播，含暂停控制与左右箭头
      const upcomingSection = page.locator('#upcoming-section')
      const carousel = upcomingSection.getByRole('region', { name: '即将开场的秒杀活动' })
      await expect(carousel).toBeVisible()

      const pauseButton = upcomingSection.getByRole('button', { name: '暂停轮播' })
      await expect(pauseButton).toBeVisible()
      await pauseButton.click()
      await expect(upcomingSection.getByRole('button', { name: '开始轮播' })).toBeVisible()
      await upcomingSection.getByRole('button', { name: '开始轮播' }).click()

      // 用关键字收窄到刚创建的一场，避免新场次排在轮播的后续条目
      const upcomingFilter = page.getByPlaceholder('输入名称筛选全部场次')
      await upcomingFilter.fill(upcoming.activityName)
      await expect(carousel.getByRole('link', { name: new RegExp(upcoming.activityName) })).toBeVisible()
      await expect(upcomingSection.getByRole('button', { name: /上一场|下一场/ })).toHaveCount(0)
      await upcomingFilter.fill('')
      await expect(pauseButton).toBeVisible()

      // 进行中：每页最多 4 场（新活动可能落在后续页，用关键字精确定位）
      const liveSection = page.locator('#live-section')
      const liveCards = liveSection.locator('article')
      await expect(liveCards.first()).toBeVisible({ timeout: 10_000 })
      expect(await liveCards.count()).toBeLessThanOrEqual(4)

      // 已结束：独立分页，每页 4 场
      const endedSection = page.locator('#ended-section')
      const endedCards = endedSection.locator('article')
      await expect(endedCards.first()).toBeVisible({ timeout: 10_000 })
      expect(await endedCards.count()).toBe(4)

      const endedPager = endedSection.getByRole('navigation', { name: '已结束分页' })
      await expect(endedPager).toBeVisible()
      const firstBefore = await endedCards.first().locator('h3').textContent()

      await endedPager.locator('.el-pager li').nth(1).click()
      await expect(endedSection.locator('nav p')).toContainText('第 5–8 场')
      await expect(endedCards.first().locator('h3')).not.toHaveText(firstBefore ?? '')
      expect(await endedCards.count()).toBe(4)

      // 关键字同时筛选三个区块，进行中保留匹配项，已结束显示独立空态
      const keywordInput = page.getByPlaceholder('输入名称筛选全部场次')
      await keywordInput.fill(running.activityName)
      await expect(liveCards.filter({ hasText: running.activityName })).toBeVisible()
      await expect(endedSection.getByText('还没有已结束的场次')).toBeVisible()
      await expect(endedPager).toHaveCount(0)

      await keywordInput.fill('')
      await expect(endedCards.first()).toBeVisible()
      await expect(endedPager).toBeVisible()

      // 再次筛选后进入详情
      await keywordInput.fill(running.activityName)
      const matchedCard = liveCards.filter({ hasText: running.activityName })
      await expect(matchedCard).toBeVisible()
      await matchedCard.getByRole('button').click()
      await expect(page).toHaveURL(new RegExp(`/activities/${running.activityId}$`))
      await expect(page.getByRole('heading', { level: 1, name: running.activityName })).toBeVisible()
      await expect(page.getByText('抢购榜')).toBeVisible()
    } finally {
      await resetActivityStock(running.activityId)
    }
  })

  test('不存在的活动展示错误态', async ({ page }) => {
    await page.goto('/activities/123456789')
    await expect(page.getByText(/活动不存在|加载失败/)).toBeVisible({ timeout: 8_000 })
  })
})

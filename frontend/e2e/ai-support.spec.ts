import { expect, test, type Page } from '@playwright/test'

/**
 * AI 客服落地页验收：只校验页面结构与前端交互，不发送消息，因此不依赖模型密钥。
 */
const PREVIEW = '[aria-label="AI 客服对话示例"]'
const TYPED = `${PREVIEW} p[aria-hidden="true"]`
const FULL_TEXT = `${PREVIEW} p.sr-only`

async function typedLength(page: Page): Promise<number> {
  return (await page.locator(TYPED).textContent())?.trim().length ?? 0
}

/** 活动数据是异步的，逐字文本与 sr-only 全文始终来自同一份文案，因此用「两者一致」判断播放结束 */
async function settled(page: Page): Promise<boolean> {
  const typed = (await page.locator(TYPED).textContent())?.trim() ?? ''
  const full = (await page.locator(FULL_TEXT).textContent())?.trim() ?? ''
  return full.length > 20 && typed === full
}

test.describe('AI 客服落地页', () => {
  test('Hero、能力区与对话区结构完整', async ({ page }) => {
    await page.goto('/ai-support')

    await expect(page.getByRole('heading', { name: '秒杀问题，问 AI 客服' })).toBeVisible()
    await expect(page.getByRole('button', { name: '立即体验' })).toBeVisible()
    await expect(page.getByRole('button', { name: '查看能力' })).toBeVisible()

    await expect(page.locator(PREVIEW)).toBeVisible()
    await expect(page.locator(PREVIEW).getByText('示例对话')).toBeVisible()

    await expect(page.getByRole('heading', { name: '不止问答，更懂秒杀现场' })).toBeVisible()
    await expect(page.locator('#ai-capabilities article')).toHaveCount(4)

    await expect(page.locator('#ai-chat')).toBeVisible()
    await expect(page.locator('#ai-input')).toBeVisible()
  })

  test('示例回答逐字播放并收敛为完整文案', async ({ page }) => {
    await page.goto('/ai-support')

    await expect.poll(() => typedLength(page)).toBeGreaterThan(0)
    await expect.poll(() => settled(page)).toBe(true)
    await expect(page.getByRole('button', { name: '跳过动画' })).toHaveCount(0)
  })

  test('重新播放会从头再打一遍', async ({ page }) => {
    await page.goto('/ai-support')

    await expect.poll(() => settled(page)).toBe(true)
    const fullText = (await page.locator(FULL_TEXT).textContent())?.trim() ?? ''
    expect(fullText.length).toBeGreaterThan(20)

    await page.getByRole('button', { name: '重新播放' }).click()

    // 先退回到部分文本，再补全，证明动画被真正重置而不是保持终态
    await expect.poll(() => typedLength(page)).toBeLessThan(fullText.length)
    await expect.poll(() => settled(page)).toBe(true)
  })

  test('主 CTA 滚动到对话区并聚焦输入框', async ({ page }) => {
    await page.goto('/ai-support')
    await expect(page.getByRole('heading', { name: '秒杀问题，问 AI 客服' })).toBeVisible()

    await page.getByRole('button', { name: '立即体验' }).click()

    await expect(page.locator('#ai-input')).toBeFocused()

    // 平滑滚动需要若干帧，等区块停在吸顶头部下方再断言位置
    const chatTop = () => page.locator('#ai-chat').evaluate((el) => el.getBoundingClientRect().top)
    await expect.poll(chatTop).toBeLessThan(180)
    expect(await chatTop()).toBeGreaterThan(-120)
  })
})

test.describe('AI 客服响应式', () => {
  for (const width of [375, 768, 1440]) {
    test(`${width}px 无横向滚动`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/ai-support')
      await expect(page.getByRole('heading', { name: '秒杀问题，问 AI 客服' })).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }

  test('移动端聊天区排在说明卡之前', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 })
    await page.goto('/ai-support')

    const chat = page.locator('#ai-input')
    const notes = page.locator('[aria-label="使用说明"]')
    await expect(chat).toBeVisible()
    await expect(notes).toBeVisible()

    const chatTop = await chat.evaluate((el) => el.getBoundingClientRect().top)
    const notesTop = await notes.evaluate((el) => el.getBoundingClientRect().top)
    expect(chatTop).toBeLessThan(notesTop)
  })
})

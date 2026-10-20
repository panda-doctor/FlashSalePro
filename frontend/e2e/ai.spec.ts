import { expect, test } from '@playwright/test'

test.describe('AI 客服', () => {
  test('发送问题 → 收到模型回复', async ({ page }) => {
    test.slow()
    await page.goto('/ai-support')
    await expect(page.getByRole('heading', { name: 'AI 客服' })).toBeVisible()

    const input = page.getByPlaceholder('输入问题，Enter 发送，Shift + Enter 换行')
    await input.fill('现在有哪些商品可以抢？')
    await input.press('Enter')

    // 用户消息 + 助手回复
    const bubbles = page.locator('.whitespace-pre-line')
    await expect(bubbles).toHaveCount(2, { timeout: 45_000 })
    await expect(bubbles.nth(1)).not.toBeEmpty()

    const reply = await bubbles.nth(1).innerText()
    expect(reply.length).toBeGreaterThan(5)
    expect(reply).not.toContain('50300')
  })

  test('超长输入被 maxlength 截断，空输入不可发送', async ({ page }) => {
    await page.goto('/ai-support')
    const input = page.getByPlaceholder('输入问题，Enter 发送，Shift + Enter 换行')

    await expect(page.getByRole('button', { name: '发送' })).toBeDisabled()

    await input.fill('a'.repeat(520))
    await expect(input).toHaveValue('a'.repeat(500))
    await expect(page.locator('.el-input__count')).toContainText(/500\s*\/\s*500/)
  })
})

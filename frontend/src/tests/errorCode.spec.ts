import { describe, expect, it } from 'vitest'
import { describeError, isAuthErrorCode } from '@/http/errorCode'
import { RESULT_CODE } from '@/types/common'

describe('describeError', () => {
  it('未授权统一引导重新登录', () => {
    const descriptor = describeError(RESULT_CODE.UNAUTHORIZED)
    expect(descriptor.action).toBe('login')
    expect(descriptor.message).toContain('登录')
    expect(isAuthErrorCode(descriptor.code)).toBe(true)
  })

  it('参数错误不直接透出后端的开发者文案', () => {
    const descriptor = describeError(RESULT_CODE.PARAM_ERROR, 'seckillStock: 秒杀库存必须大于 0')
    expect(descriptor.message).toBe('请求参数有误，请检查后重试')
    expect(descriptor.message).not.toContain('seckillStock')
  })

  it('业务错误优先采用后端更精确的提示', () => {
    const descriptor = describeError(RESULT_CODE.NOT_FOUND, '活动不存在，activityId=9')
    expect(descriptor.message).toBe('活动不存在，activityId=9')
    expect(descriptor.action).toBe('none')
  })

  it('售罄与重复购买有独立文案', () => {
    expect(describeError(RESULT_CODE.OUT_OF_STOCK).message).toContain('抢空')
    expect(describeError(RESULT_CODE.DUPLICATE_PURCHASE).message).toContain('限购')
  })

  it('未知错误码回退为通用提示', () => {
    const descriptor = describeError(99999)
    expect(descriptor.message).toBe('请求失败，请稍后重试')
    expect(descriptor.action).toBe('none')
  })

  it('AI 错误提示区分未配置与调用失败', () => {
    expect(describeError(RESULT_CODE.AI_SERVICE_UNCONFIGURED).message).toContain('密钥')
    expect(describeError(RESULT_CODE.AI_SERVICE_ERROR).message).toContain('暂时不可用')
  })
})

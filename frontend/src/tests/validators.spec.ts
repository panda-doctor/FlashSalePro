import { describe, expect, it } from 'vitest'
import {
  resolveRedirect,
  validateAccountName,
  validateConfirmPassword,
  validateDisplayName,
  validatePassword,
} from '@/utils/validators'

describe('账号校验（对齐后端 @Pattern）', () => {
  it('接受 3-32 位字母数字与 . _ -', () => {
    expect(validateAccountName('abc')).toBeNull()
    expect(validateAccountName('user.name_01-x')).toBeNull()
    expect(validateAccountName('User.Name')).toBeNull()
  })

  it('前后空格会被裁剪后再校验', () => {
    expect(validateAccountName('  flash_user  ')).toBeNull()
  })

  it('拒绝过短、超长与非法字符', () => {
    expect(validateAccountName('ab')).not.toBeNull()
    expect(validateAccountName('a'.repeat(33))).not.toBeNull()
    expect(validateAccountName('中文账号')).not.toBeNull()
    expect(validateAccountName('user name')).not.toBeNull()
  })
})

describe('密码校验（对齐 @Size）', () => {
  it('注册要求 10-72 位', () => {
    expect(validatePassword('123456789', { min: 10 })).toContain('至少')
    expect(validatePassword('1234567890', { min: 10 })).toBeNull()
    expect(validatePassword('a'.repeat(73), { min: 10 })).toContain('最多')
  })

  it('空密码给出明确提示', () => {
    expect(validatePassword('')).toBe('请输入密码')
  })
})

describe('昵称与确认密码', () => {
  it('昵称最多 64 字符', () => {
    expect(validateDisplayName('a'.repeat(64))).toBeNull()
    expect(validateDisplayName('a'.repeat(65))).not.toBeNull()
  })

  it('两次密码必须一致', () => {
    expect(validateConfirmPassword('abcdefghij', '')).toContain('再次')
    expect(validateConfirmPassword('abcdefghij', 'abcdefghij')).toBeNull()
    expect(validateConfirmPassword('abcdefghij', 'abcdefghik')).toContain('不一致')
  })
})

describe('回跳地址只允许站内路径', () => {
  it('保留站内路径', () => {
    expect(resolveRedirect('/orders?activityId=1')).toBe('/orders?activityId=1')
  })

  it('拒绝外部与协议相对地址', () => {
    expect(resolveRedirect('https://evil.com')).toBe('/')
    expect(resolveRedirect('//evil.com')).toBe('/')
    expect(resolveRedirect(undefined)).toBe('/')
  })
})

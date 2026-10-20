/**
 * 校验规则严格对齐后端注解：
 * RegisterRequest#accountName  @Pattern("(?i)[a-z0-9._-]{3,32}")
 * RegisterRequest#password     @Size(min = 10, max = 72)
 * LoginRequest#password        @Size(max = 72)
 * displayName                  @Size(max = 64)
 */
export const ACCOUNT_NAME_PATTERN = /^[a-z0-9._-]{3,32}$/i

export function validateAccountName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return '请输入账号'
  if (!ACCOUNT_NAME_PATTERN.test(trimmed)) {
    return '账号需为 3-32 位字母、数字、点、下划线或短横线'
  }
  return null
}

export function validatePassword(value: string, options: { min?: number } = {}): string | null {
  const min = options.min ?? 10
  if (!value) return '请输入密码'
  if (value.length < min) return `密码至少 ${min} 位`
  if (value.length > 72) return '密码最多 72 位'
  return null
}

export function validateDisplayName(value: string): string | null {
  if (value.length > 64) return '昵称最多 64 个字符'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return '请再次输入密码'
  if (password !== confirm) return '两次输入的密码不一致'
  return null
}

/** Element Plus 表单校验适配：返回 null 表示通过 */
export function createStringValidator(
  check: (value: string) => string | null,
): (_rule: unknown, value: unknown, callback: (error?: Error) => void) => void {
  return (_rule, value, callback) => {
    const message = check(typeof value === 'string' ? value : '')
    if (message) callback(new Error(message))
    else callback()
  }
}

/** 仅允许站内相对路径回跳，避免开放重定向 */
export function resolveRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

import axios from 'axios'
import { RESULT_CODE, type ApiResult } from '@/types/common'

export const CSRF_COOKIE_NAME = 'FLASH_CSRF'

let token = ''
let refreshing: Promise<string> | null = null

export function getCsrfToken(): string {
  return token
}

export function setCsrfToken(value: string | null | undefined): void {
  token = value ?? ''
}

export function clearCsrfToken(): void {
  token = ''
}

/** 后端把 CSRF 明文写在非 HttpOnly 的 FLASH_CSRF Cookie 中，可作为兜底来源 */
export function readCsrfCookie(): string {
  if (typeof document === 'undefined') return ''
  const prefix = `${CSRF_COOKIE_NAME}=`
  const hit = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : ''
}

/**
 * 刷新 CSRF 令牌：优先用 GET /api/auth/csrf 的返回值，失败时回退读取 Cookie。
 * 这里使用裸 axios，避免与 client.ts 形成循环依赖。
 */
export function refreshCsrfToken(): Promise<string> {
  if (refreshing) return refreshing

  refreshing = axios
    .get<ApiResult<string>>('/api/auth/csrf', {
      withCredentials: true,
      timeout: 10000,
    })
    .then((response) => {
      const body = response.data
      if (!body || body.code !== RESULT_CODE.SUCCESS) {
        const fallback = readCsrfCookie()
        if (fallback) {
          token = fallback
          return fallback
        }
        throw new Error(body?.message || '无法获取 CSRF 令牌')
      }
      const value = typeof body.data === 'string' && body.data ? body.data : readCsrfCookie()
      if (!value) throw new Error('无法获取 CSRF 令牌')
      token = value
      return value
    })
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

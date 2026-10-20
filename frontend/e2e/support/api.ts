import { request, type APIRequestContext } from '@playwright/test'

/**
 * E2E 数据准备：直接调用网关接口，避免每个用例都从 UI 造数据。
 * 所有请求走 8090，不经过 Vite 代理（Node 环境不存在同源限制）。
 */
export const API_BASE = process.env.E2E_API_BASE ?? 'http://127.0.0.1:8090'
export const ADMIN_TOKEN = process.env.E2E_ADMIN_TOKEN ?? 'admin-secret-2026'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data?: T
}

function ctx(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API_BASE, timeout: 15_000 })
}

async function unwrap<T>(response: Awaited<ReturnType<APIRequestContext['post']>>): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>
  if (body.code !== 0) {
    throw new Error(`接口返回业务错误 code=${body.code} message=${body.message}`)
  }
  return body.data as T
}

export function uniqueAccount(prefix = 'e2e'): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

/** 注册并返回账号信息（同时建立会话 Cookie，但该 Cookie 属于 APIRequestContext，不进浏览器） */
export async function registerUser(accountName: string, password: string, displayName: string) {
  const api = await ctx()
  try {
    const res = await api.post('/api/auth/register', {
      data: { accountName, password, displayName },
    })
    return await unwrap<{ userId: number; accountName: string; displayName: string }>(res)
  } finally {
    await api.dispose()
  }
}

export interface CreatedActivity {
  activityId: number
  activityName: string
}

/** 管理端创建活动并预热，返回 activityId */
export async function createAndPreheatActivity(options?: {
  stock?: number
  priceCents?: number
}): Promise<CreatedActivity> {
  const stock = options?.stock ?? 3
  const price = options?.priceCents ?? 100
  const name = `E2E秒杀-${Date.now()}`
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const api = await ctx()
  try {
    const start = new Date(Date.now() - 60_000)
    const end = new Date(Date.now() + 30 * 60_000)
    const created = await unwrap<{ activityId: number }>(
      await api.post('/api/admin/seckill/activities', {
        headers: { 'X-Admin-Token': ADMIN_TOKEN },
        data: {
          productId: 1,
          activityName: name,
          startTime: fmt(start),
          endTime: fmt(end),
          seckillPrice: price,
          seckillStock: stock,
          limitPerUser: 1,
        },
      }),
    )

    await unwrap<unknown>(
      await api.post(`/api/admin/seckill/activities/${created.activityId}/preheat`, {
        headers: { 'X-Admin-Token': ADMIN_TOKEN },
      }),
    )

    return { activityId: created.activityId, activityName: name }
  } finally {
    await api.dispose()
  }
}

/** 清理：活动没有删除接口，这里只做「重置库存」，避免残留脏库存不影响下一次运行 */
export async function resetActivityStock(activityId: number): Promise<void> {
  const api = await ctx()
  try {
    await api.post(`/api/admin/seckill/activities/${activityId}/reset-stock`, {
      headers: { 'X-Admin-Token': ADMIN_TOKEN },
    })
  } catch {
    // 清理失败不影响用例结论
  } finally {
    await api.dispose()
  }
}

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

/** 创建一场未开始的活动（不预热），用于验证「即将开场」轮播区块 */
export async function createUpcomingActivity(options?: {
  hoursFromNow?: number
  priceCents?: number
}): Promise<CreatedActivity> {
  const name = `E2E预告-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const start = new Date(Date.now() + (options?.hoursFromNow ?? 1) * 3600_000)
  const end = new Date(start.getTime() + 45 * 60_000)

  const api = await ctx()
  try {
    const created = await unwrap<{ activityId: number }>(
      await api.post('/api/admin/seckill/activities', {
        headers: { 'X-Admin-Token': ADMIN_TOKEN },
        data: {
          productId: 1,
          activityName: name,
          startTime: fmt(start),
          endTime: fmt(end),
          seckillPrice: options?.priceCents ?? 28900,
          seckillStock: 20,
          limitPerUser: 1,
        },
      }),
    )
    return { activityId: created.activityId, activityName: name }
  } finally {
    await api.dispose()
  }
}

export interface CreatedProduct {
  productId: string
  name: string
}

/**
 * 创建一件没有图片的在售商品，用于稳定覆盖「耳机示意图 + 配色示意」。
 * 后端没有删除接口，商品会保留在目录中，因此名称带时间戳避免重复。
 */
export async function createProductWithoutImage(options?: {
  totalStock?: number
  priceCents?: number
}): Promise<CreatedProduct> {
  const name = `E2E示意图耳机-${Date.now()}`
  const api = await ctx()
  try {
    const created = await unwrap<{ productId: string }>(
      await api.post('/api/admin/products', {
        headers: { 'X-Admin-Token': ADMIN_TOKEN },
        data: {
          name,
          description: '无商品图时展示低饱和耳机示意图，配色仅用于预览。',
          imageUrl: null,
          originalPrice: options?.priceCents ?? 29900,
          totalStock: options?.totalStock ?? 12,
          status: 'ON_SHELF',
        },
      }),
    )
    return { productId: created.productId, name }
  } finally {
    await api.dispose()
  }
}

interface AdminProductDetail {
  productId: number | string
  name: string
  description: string | null
  imageUrl: string | null
  originalPrice: number
  totalStock: number
}

/** 商品没有删除接口，用下架清理 E2E 造的数据，避免污染公开商品列表 */
export async function deactivateProduct(productId: string): Promise<void> {
  const api = await ctx()
  try {
    const headers = { 'X-Admin-Token': ADMIN_TOKEN }
    const detail = await unwrap<AdminProductDetail>(
      await api.get(`/api/admin/products/${productId}`, { headers }),
    )
    await unwrap<unknown>(
      await api.post('/api/admin/products', {
        headers,
        data: {
          productId: detail.productId,
          name: detail.name,
          description: detail.description,
          imageUrl: detail.imageUrl,
          originalPrice: detail.originalPrice,
          totalStock: detail.totalStock,
          status: 'OFF_SHELF',
        },
      }),
    )
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

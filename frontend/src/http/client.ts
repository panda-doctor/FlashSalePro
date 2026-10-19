import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ApiError, RESULT_CODE, type ApiResult } from '@/types/common'
import { describeError } from '@/http/errorCode'
import { getCsrfToken, readCsrfCookie, refreshCsrfToken } from '@/http/csrf'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 该请求需要携带 X-Admin-Token */
    admin?: boolean
    /** 40100 时不触发全局登出（用于 /api/auth/me 启动探测） */
    skipAuthHandler?: boolean
    /** 内部标记：CSRF 失效只自动重放一次 */
    csrfRetried?: boolean
  }
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])
const DEFAULT_TIMEOUT = 15000

let adminTokenProvider: () => string = () => ''
let unauthorizedHandler: ((error: ApiError) => void) | null = null

/** 由 main.ts 注入 Pinia 中的管理端令牌，避免 http 层直接依赖 store */
export function setAdminTokenProvider(provider: () => string): void {
  adminTokenProvider = provider
}

/** 由 main.ts 注入会话失效处理（清空用户态 + 跳登录） */
export function setUnauthorizedHandler(handler: (error: ApiError) => void): void {
  unauthorizedHandler = handler
}

export const httpClient = axios.create({
  // 必须同源：会话 Cookie SameSite=Strict 且 Path=/api，开发期由 Vite 代理转发
  baseURL: '',
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT,
  headers: { Accept: 'application/json' },
})

function isEnvelope(payload: unknown): payload is ApiResult<unknown> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'code' in payload &&
    typeof (payload as { code: unknown }).code === 'number'
  )
}

function networkMessage(status: number | undefined, code: string | undefined): string {
  if (code === 'ECONNABORTED') return '请求超时，请确认后端服务已启动'
  if (!status) return '无法连接后端服务，请确认网关 8090 已启动'
  if (status === 400) return '请求参数缺失或类型错误'
  if (status === 404) return '请求资源不存在'
  if (status === 413) return '上传文件超过服务端限制'
  return `服务异常（HTTP ${status}）`
}

function notifyUnauthorized(error: ApiError, config: AxiosRequestConfig): void {
  if (error.code !== RESULT_CODE.UNAUTHORIZED) return
  if (config.skipAuthHandler || config.admin) return
  unauthorizedHandler?.(error)
}

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (MUTATING_METHODS.has(method)) {
    const token = getCsrfToken() || readCsrfCookie()
    if (token) config.headers.set('X-CSRF-Token', token)
  }
  if (config.admin) {
    const adminToken = adminTokenProvider()
    if (adminToken) config.headers.set('X-Admin-Token', adminToken)
  }
  return config
})

httpClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    if (!isEnvelope(response.data)) return response

    const body = response.data
    if (body.code === RESULT_CODE.SUCCESS) return response

    const error = new ApiError(body.code, describeError(body.code, body.message).message, {
      requestId: body.requestId,
      payload: body,
    })

    if (body.code === RESULT_CODE.CSRF_INVALID && !response.config.csrfRetried) {
      const freshToken = await refreshCsrfToken()
      const retryConfig: AxiosRequestConfig = { ...response.config, csrfRetried: true }
      retryConfig.headers = { ...response.config.headers, 'X-CSRF-Token': freshToken }
      return httpClient.request(retryConfig)
    }

    notifyUnauthorized(error, response.config)
    throw error
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const payload = error.response?.data

      if (isEnvelope(payload) && payload.code !== RESULT_CODE.SUCCESS) {
        const apiError = new ApiError(payload.code, describeError(payload.code, payload.message).message, {
          requestId: payload.requestId,
          payload,
        })
        notifyUnauthorized(apiError, error.config ?? {})
        return Promise.reject(apiError)
      }

      const config = error.config ?? {}
      const apiError = new ApiError(status ?? 0, networkMessage(status, error.code), {
        payload: error.response?.data,
      })
      notifyUnauthorized(apiError, config)
      return Promise.reject(apiError)
    }

    return Promise.reject(error)
  },
)

/** 所有业务请求的唯一出口：成功时直接返回 data */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<ApiResult<T>>(config)
  return response.data?.data as T
}

export const http = {
  get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    return request<T>({ ...config, url, method: 'get' })
  },
  post<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
    return request<T>({ ...config, url, method: 'post', data })
  },
  put<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}): Promise<T> {
    return request<T>({ ...config, url, method: 'put', data })
  },
  delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    return request<T>({ ...config, url, method: 'delete' })
  },
}

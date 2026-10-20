/**
 * 后端统一响应信封（flash-sale-common/.../common/api/Result.java）
 * @JsonInclude(NON_NULL)：data 为 null 时该键不会出现。
 */
export interface ApiResult<T> {
  code: number
  message: string
  data?: T
  requestId?: string
  timestamp?: number
}

/** 后端 PageResponse：records/page/pageSize/total/pages */
export interface PageResponse<T> {
  records: T[]
  page: number
  pageSize: number
  total: number
  pages: number
}

/** 后端 ResultCode 全量枚举（flash-sale-common/.../common/api/ResultCode.java） */
export const RESULT_CODE = {
  SUCCESS: 0,
  PARAM_ERROR: 40001,
  NOT_FOUND: 40004,
  UNAUTHORIZED: 40100,
  INVALID_CREDENTIALS: 40101,
  CSRF_INVALID: 40301,
  DUPLICATE_PURCHASE: 40901,
  OUT_OF_STOCK: 40902,
  USER_ID_TAKEN: 40903,
  ACCOUNT_NAME_TAKEN: 40904,
  RATE_LIMITED: 42900,
  SYSTEM_ERROR: 50000,
  AI_SERVICE_UNCONFIGURED: 50300,
  AI_SERVICE_ERROR: 50301,
} as const

export type ResultCode = (typeof RESULT_CODE)[keyof typeof RESULT_CODE]

/** 统一业务异常：HTTP 200 但 body.code !== 0 时抛出 */
export class ApiError extends Error {
  readonly code: number
  readonly requestId?: string
  readonly payload?: unknown

  constructor(code: number, message: string, options?: { requestId?: string; payload?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.requestId = options?.requestId
    this.payload = options?.payload
  }
}

export interface PageQuery {
  page: number
  pageSize: number
  keyword?: string
}

export interface IdParam {
  id: string | number
}

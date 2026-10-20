import { RESULT_CODE } from '@/shared/types/common'

/** 错误处置建议：由页面/拦截器决定具体动作，文案层不直接跳转 */
export type ErrorAction = 'none' | 'login' | 'admin-token' | 'retry'

export interface ErrorDescriptor {
  code: number
  /** 面向用户的中文文案 */
  message: string
  action: ErrorAction
}

const DESCRIPTORS: Record<number, Omit<ErrorDescriptor, 'code'>> = {
  [RESULT_CODE.PARAM_ERROR]: { message: '请求参数有误，请检查后重试', action: 'none' },
  [RESULT_CODE.NOT_FOUND]: { message: '目标资源不存在或已下架', action: 'none' },
  [RESULT_CODE.UNAUTHORIZED]: { message: '登录状态已失效，请重新登录', action: 'login' },
  [RESULT_CODE.INVALID_CREDENTIALS]: { message: '账号或密码错误', action: 'none' },
  [RESULT_CODE.CSRF_INVALID]: { message: '安全校验已过期，请重试', action: 'retry' },
  [RESULT_CODE.DUPLICATE_PURCHASE]: { message: '每人限购一件，你已参与过该活动', action: 'none' },
  [RESULT_CODE.OUT_OF_STOCK]: { message: '商品已被抢空', action: 'none' },
  [RESULT_CODE.USER_ID_TAKEN]: { message: '用户标识已被占用', action: 'none' },
  [RESULT_CODE.ACCOUNT_NAME_TAKEN]: { message: '该账号名已被使用', action: 'none' },
  [RESULT_CODE.RATE_LIMITED]: { message: '操作过于频繁，请稍后再试', action: 'retry' },
  [RESULT_CODE.SYSTEM_ERROR]: { message: '系统繁忙，请稍后重试', action: 'retry' },
  [RESULT_CODE.AI_SERVICE_UNCONFIGURED]: { message: 'AI 客服尚未配置模型密钥', action: 'none' },
  [RESULT_CODE.AI_SERVICE_ERROR]: { message: 'AI 客服暂时不可用，请稍后再试', action: 'none' },
}

/**
 * 将后端错误码转换为用户可读文案。
 * 后端 message 往往更精确（例如 “活动未开始”），但参数校验会拼出 “字段: 提示; ...” 的开发者文案，
 * 因此仅在业务类错误时优先采用后端文案。
 */
export function describeError(code: number, backendMessage?: string): ErrorDescriptor {
  const preset = DESCRIPTORS[code]
  const isDeveloperFacing = code === RESULT_CODE.PARAM_ERROR
  const message =
    !isDeveloperFacing && backendMessage && backendMessage.trim() ? backendMessage.trim() : (preset?.message ?? '请求失败，请稍后重试')

  return {
    code,
    message,
    action: preset?.action ?? 'none',
  }
}

export function isAuthErrorCode(code: number): boolean {
  return code === RESULT_CODE.UNAUTHORIZED
}

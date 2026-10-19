import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@/types/auth'
import { clearCsrfToken, setCsrfToken } from '@/http/csrf'
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/api/auth'
import { ApiError, RESULT_CODE } from '@/types/common'

/**
 * 仅存放跨页面共享的会话状态。
 * 页面级筛选条件、表单草稿等局部状态不得进入此 store。
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  /** 启动时的 /auth/me 探测是否已完成，路由守卫据此避免误跳登录 */
  const initialized = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const displayName = computed(() => user.value?.displayName || user.value?.accountName || '')

  function applyAuth(payload: AuthResponse): void {
    user.value = payload.user
    setCsrfToken(payload.csrfToken)
  }

  function setUser(next: UserProfile | null): void {
    user.value = next
  }

  function markInitialized(): void {
    initialized.value = true
  }

  function reset(): void {
    user.value = null
    clearCsrfToken()
  }

  function login(payload: LoginRequest): Promise<AuthResponse> {
    return loginRequest(payload).then((data) => {
      applyAuth(data)
      markInitialized()
      return data
    })
  }

  function register(payload: RegisterRequest): Promise<AuthResponse> {
    return registerRequest(payload).then((data) => {
      applyAuth(data)
      markInitialized()
      return data
    })
  }

  /**
   * 首次导航时恢复登录态。
   * 40100 视为未登录；网络异常只记录日志，避免把“后端未启动”误判为“需要重新登录”。
   */
  function restoreSession(): Promise<void> {
    if (initialized.value) return Promise.resolve()

    return fetchCurrentUser()
      .then((profile) => {
        user.value = profile
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === RESULT_CODE.UNAUTHORIZED) {
          user.value = null
          return
        }
        console.error('会话恢复失败', error)
      })
      .finally(() => {
        initialized.value = true
      })
  }

  function logout(): Promise<void> {
    return logoutRequest()
      .catch((error: unknown) => {
        console.error('退出登录请求失败', error)
      })
      .finally(() => {
        reset()
        markInitialized()
      })
  }

  return {
    user,
    initialized,
    isLoggedIn,
    displayName,
    applyAuth,
    setUser,
    markInitialized,
    reset,
    login,
    register,
    restoreSession,
    logout,
  }
})

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'flash.admin.token'

function readStoredToken(): string {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(STORAGE_KEY) ?? ''
}

function persist(value: string): void {
  if (typeof window === 'undefined') return
  if (value) window.sessionStorage.setItem(STORAGE_KEY, value)
  else window.sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * 管理端使用静态 X-Admin-Token（后端无角色体系，禁止虚构 RBAC）。
 * 仅存 sessionStorage：关闭标签页即失效，避免长期落盘。
 */
export const useAdminTokenStore = defineStore('adminToken', () => {
  const token = ref(readStoredToken())
  /** 最近一次管理端接口成功的时间戳，=0 表示尚未验证 */
  const verifiedAt = ref(0)

  const hasToken = computed(() => token.value.length > 0)

  function setToken(value: string): void {
    token.value = value.trim()
    verifiedAt.value = 0
    persist(token.value)
  }

  function markVerified(): void {
    verifiedAt.value = Date.now()
  }

  function clear(): void {
    token.value = ''
    verifiedAt.value = 0
    persist('')
  }

  return { token, hasToken, verifiedAt, setToken, markVerified, clear }
})

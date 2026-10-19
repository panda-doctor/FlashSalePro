import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 权限模型与后端一致：公开 / 会话 / 管理令牌。
 * 后端无角色体系，因此不虚构角色路由。
 */
export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    // 首次导航时用 GET /api/auth/me 恢复登录态（40100 视为未登录）
    if (!auth.initialized) await auth.restoreSession()

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    if ((to.name === 'login' || to.name === 'register') && auth.isLoggedIn) {
      return { name: 'home' }
    }

    return true
  })

  router.afterEach((to) => {
    const appTitle = import.meta.env.VITE_APP_TITLE || '秒杀商城'
    document.title = to.meta.title ? `${to.meta.title} · ${appTitle}` : appTitle
  })
}

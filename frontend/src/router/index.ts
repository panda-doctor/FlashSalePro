import { createRouter, createWebHistory } from 'vue-router'
import { routes } from '@/router/routes'
import { setupRouterGuards } from '@/router/guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

setupRouterGuards(router)

export default router

import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** 需要有效会话（FLASH_SESSION） */
    requiresAuth?: boolean
    /** 需要管理端令牌（X-Admin-Token），页面内再渲染令牌闸门 */
    requiresAdmin?: boolean
  }
}

const MainLayout = () => import('@/layouts/MainLayout.vue')

/**
 * 路由名约定（后续模块必须复用，导航依赖 hasRoute 自动显隐）：
 * login / register / profile / products / product-detail /
 * activities / activity-detail / orders / ai-support / admin
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/views/ProductListView.vue'),
        meta: { title: '商品' },
      },
      {
        path: 'products/:id',
        name: 'product-detail',
        component: () => import('@/views/ProductDetailView.vue'),
        meta: { title: '商品详情' },
      },
      {
        path: 'activities',
        name: 'activities',
        component: () => import('@/views/ActivityListView.vue'),
        meta: { title: '秒杀活动' },
      },
      {
        path: 'activities/:id',
        name: 'activity-detail',
        component: () => import('@/views/ActivityDetailView.vue'),
        meta: { title: '活动详情' },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/views/OrdersView.vue'),
        meta: { title: '我的订单', requiresAuth: true },
      },
      {
        path: 'ai-support',
        name: 'ai-support',
        component: () => import('@/views/AiSupportView.vue'),
        meta: { title: 'AI 客服' },
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: '登录' },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { title: '注册' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { title: '个人中心', requiresAuth: true },
      },
      {
        path: '404',
        name: 'not-found',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: '页面不存在' },
      },
    ],
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { title: '管理台', requiresAdmin: true },
    children: [
      { path: '', redirect: { name: 'admin-products' } },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/views/admin/AdminProductView.vue'),
        meta: { title: '商品管理', requiresAdmin: true },
      },
      {
        path: 'activities',
        name: 'admin-activities',
        component: () => import('@/views/admin/AdminActivityView.vue'),
        meta: { title: '活动运维', requiresAdmin: true },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/AdminUserView.vue'),
        meta: { title: '用户管理', requiresAdmin: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

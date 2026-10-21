import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** 需要有效会话（FLASH_SESSION） */
    requiresAuth?: boolean
    /** 需要管理端令牌（X-Admin-Token），页面内再渲染令牌闸门 */
    requiresAdmin?: boolean
    /** 深色沉浸页：顶栏初始透明叠在页面之上，滚动后转为浅色玻璃 */
    transparentHeader?: boolean
  }
}

const MainLayout = () => import('@/shared/layouts/MainLayout.vue')

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
        meta: { title: '首页', transparentHeader: true },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/modules/product/views/ProductListView.vue'),
        meta: { title: '商品' },
      },
      {
        path: 'products/:id',
        name: 'product-detail',
        component: () => import('@/modules/product/views/ProductDetailView.vue'),
        meta: { title: '商品详情' },
      },
      {
        path: 'activities',
        name: 'activities',
        component: () => import('@/modules/activity/views/ActivityListView.vue'),
        meta: { title: '秒杀活动' },
      },
      {
        path: 'activities/:id',
        name: 'activity-detail',
        component: () => import('@/modules/activity/views/ActivityDetailView.vue'),
        meta: { title: '活动详情' },
      },
      {
        path: 'orders',
        name: 'orders',
        component: () => import('@/modules/order/views/OrdersView.vue'),
        meta: { title: '我的订单', requiresAuth: true },
      },
      {
        path: 'ai-support',
        name: 'ai-support',
        component: () => import('@/modules/ai/views/AiSupportView.vue'),
        meta: { title: 'AI 客服' },
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/modules/auth/views/LoginView.vue'),
        meta: { title: '登录' },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/modules/auth/views/RegisterView.vue'),
        meta: { title: '注册' },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/modules/auth/views/ProfileView.vue'),
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
    component: () => import('@/modules/admin/layouts/AdminLayout.vue'),
    redirect: { name: 'admin-dashboard' },
    meta: { title: '管理台', requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/modules/admin/views/AdminDashboardView.vue'),
        meta: { title: '经营看板', requiresAdmin: true },
      },
      {
        path: 'activities',
        name: 'admin-activities',
        component: () => import('@/modules/admin/views/AdminActivityView.vue'),
        meta: { title: '活动运维', requiresAdmin: true },
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('@/modules/admin/views/AdminProductView.vue'),
        meta: { title: '商品管理', requiresAdmin: true },
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/modules/admin/views/AdminOrderView.vue'),
        meta: { title: '订单管理', requiresAdmin: true },
      },
      {
        path: 'dead-letters',
        name: 'admin-dead-letters',
        component: () => import('@/modules/admin/views/AdminDeadLetterView.vue'),
        meta: { title: '死信管理', requiresAdmin: true },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/modules/admin/views/AdminUserView.vue'),
        meta: { title: '用户管理', requiresAdmin: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

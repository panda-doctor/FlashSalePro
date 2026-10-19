import type { Component } from 'vue'
import { Bot, LayoutDashboard, ReceiptText, ShoppingBag, Zap } from 'lucide-vue-next'

export interface NavItem {
  /** 路由名；模块未接入时 hasRoute 为 false，导航自动隐藏 */
  name: string
  label: string
  icon: Component
  requiresAuth?: boolean
}

/** 用户端主导航（顺序即信息优先级） */
export const primaryNav: NavItem[] = [
  { name: 'products', label: '商品', icon: ShoppingBag },
  { name: 'activities', label: '秒杀活动', icon: Zap },
  { name: 'orders', label: '我的订单', icon: ReceiptText, requiresAuth: true },
  { name: 'ai-support', label: 'AI 客服', icon: Bot },
  { name: 'admin', label: '管理台', icon: LayoutDashboard },
]

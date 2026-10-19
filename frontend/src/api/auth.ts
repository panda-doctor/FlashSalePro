import { http } from '@/http/client'
import type {
  AdminUserCreateRequest,
  AdminUserQuery,
  AdminUserUpdateRequest,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from '@/types/auth'
import type { PageResponse } from '@/types/common'

/** 认证域：flash-sale-auth UserAuthController */
export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return http.post<AuthResponse>('/api/auth/register', payload)
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return http.post<AuthResponse>('/api/auth/login', payload)
}

/** 启动时探测会话；40100 视为未登录，不触发全局登出 */
export function fetchCurrentUser(): Promise<UserProfile> {
  return http.get<UserProfile>('/api/auth/me', { skipAuthHandler: true })
}

export function logout(): Promise<void> {
  return http.post<void>('/api/auth/logout')
}

/** 管理端用户：flash-sale-auth AdminUserController（M7 使用） */
export function listAdminUsers(query: AdminUserQuery): Promise<PageResponse<UserProfile>> {
  return http.get<PageResponse<UserProfile>>('/api/admin/users', {
    admin: true,
    params: {
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status === '' || query.status === undefined ? undefined : query.status,
    },
  })
}

export function getAdminUser(userId: number): Promise<UserProfile> {
  return http.get<UserProfile>(`/api/admin/users/${userId}`, { admin: true })
}

export function createAdminUser(payload: AdminUserCreateRequest): Promise<UserProfile> {
  return http.post<UserProfile>('/api/admin/users', payload, { admin: true })
}

export function updateAdminUser(userId: number, payload: AdminUserUpdateRequest): Promise<UserProfile> {
  return http.put<UserProfile>(`/api/admin/users/${userId}`, payload, { admin: true })
}

export function deleteAdminUser(userId: number): Promise<void> {
  return http.delete<void>(`/api/admin/users/${userId}`, { admin: true })
}

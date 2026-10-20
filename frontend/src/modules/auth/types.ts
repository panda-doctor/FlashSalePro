/**
 * 认证域契约来源：
 * flash-sale-auth-core/.../user/dto/request/*.java
 * flash-sale-auth-core/.../user/dto/response/{AuthResponse,UserProfileResponse}.java
 */

/** user_account.status：0 禁用 / 1 正常（软删除为 deleted_at，不在接口中暴露） */
export type UserStatus = 0 | 1

export interface UserProfile {
  id: number
  accountName: string
  /** 可空；无 @JsonInclude 时会显式返回 null */
  displayName: string | null
  status: number
  /** 无 @JsonFormat → ISO-8601，例如 2026-01-01T10:00:00 */
  createdAt: string
}

export interface AuthResponse {
  user: UserProfile
  /** 写请求需放进 X-CSRF-Token */
  csrfToken: string
}

export interface LoginRequest {
  /** (?i)[a-z0-9._-]{3,32} */
  accountName: string
  /** 10-72 位（登录侧仅限制 ≤72） */
  password: string
}

export interface RegisterRequest {
  /** (?i)[a-z0-9._-]{3,32} */
  accountName: string
  /** 10-72 位 */
  password: string
  /** ≤64，可空 */
  displayName?: string
}

export interface AdminUserCreateRequest {
  accountName: string
  password: string
  displayName?: string
}

export interface AdminUserUpdateRequest {
  displayName?: string
  status?: UserStatus
  password?: string
}

export interface AdminUserQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: UserStatus | ''
}

/** 管理端用户表单的统一提交载荷：创建时必填账号/密码，编辑时账号只读 */
export interface AdminUserFormPayload {
  accountName: string
  password?: string
  displayName?: string
  status?: UserStatus
}

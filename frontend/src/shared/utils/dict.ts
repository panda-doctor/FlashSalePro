/** 字典与标签：值严格取自后端枚举 / DDL 注释，不臆造码值 */

export const USER_STATUS_LABEL: Record<number, string> = {
  0: '禁用',
  1: '正常',
}

export function userStatusLabel(status: number): string {
  return USER_STATUS_LABEL[status] ?? `未知(${status})`
}

export type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

/** user_account.status 对应的标签语义 */
export function userStatusTagType(status: number): TagType {
  if (status === 1) return 'success'
  if (status === 0) return 'info'
  return 'danger'
}

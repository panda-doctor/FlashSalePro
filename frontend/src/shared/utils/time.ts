/**
 * 时间格式分裂（后端事实）：
 * - 活动域：@JsonFormat("yyyy-MM-dd HH:mm:ss", GMT+8)
 * - 用户 / 订单 createdAt：无注解 → ISO-8601（2026-01-01T10:00:00）
 * 两套 formatter 不可混用。
 */

const ACTIVITY_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 后端活动时间（GMT+8）解析；返回本地时间对象 */
export function parseActivityTime(value: string): Date | null {
  if (!ACTIVITY_TIME_PATTERN.test(value)) return null
  return toDate(value)
}

/** 活动域时间原样透传（表单提交必须保持 "yyyy-MM-dd HH:mm:ss"） */
export function normalizeActivityTime(value: string): string {
  return value.trim().slice(0, 19)
}

/** 展示：2026-10-19 20:30:00 */
export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`
}

/** 展示：10-19 20:30（列表用短格式） */
export function formatShortDateTime(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toTimestamp(value: string | null | undefined): number {
  const date = toDate(value)
  return date ? date.getTime() : 0
}

/** 毫秒时间戳 → 本地时间字符串（榜单 score 用） */
export function formatTimestamp(ms: number | null | undefined): string {
  if (!ms || Number.isNaN(ms)) return '—'
  return formatDateTime(new Date(ms).toISOString())
}

/** 倒计时文案：不足一天显示 HH:mm:ss，超过一天显示 N天 HH:mm:ss */
export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return days > 0 ? `${days}天 ${clock}` : clock
}

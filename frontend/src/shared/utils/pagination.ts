/** 分页纯函数：列表页与前端切片分页共用，避免各页各写一套越界与区间逻辑 */

function safeSize(pageSize: number): number {
  return Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 0
}

function safeTotal(total: number): number {
  return Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
}

/** 总页数：空列表也保留 1 页，便于展示「第 1 / 1 页」 */
export function pageCount(total: number, pageSize: number): number {
  const size = safeSize(pageSize)
  const count = safeTotal(total)
  if (!size || !count) return 1
  return Math.max(1, Math.ceil(count / size))
}

/** 把任意页码夹取到 [1, pageCount] */
export function clampPage(page: number, total: number, pageSize: number): number {
  const current = Number.isFinite(page) ? Math.floor(page) : 1
  const max = pageCount(total, pageSize)
  return Math.min(Math.max(1, current), max)
}

/** 当前页切片，不修改原数组；页码越界返回最后一页切片 */
export function pageSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const size = safeSize(pageSize)
  if (!size || !items.length) return []
  const safePage = clampPage(page, items.length, size)
  const start = (safePage - 1) * size
  return items.slice(start, start + size)
}

/** 当前页区间（1 基，含首尾）；空数据返回 0–0 */
export function pageRange(
  page: number,
  pageSize: number,
  total: number,
): { start: number; end: number } {
  const size = safeSize(pageSize)
  const count = safeTotal(total)
  if (!size || !count) return { start: 0, end: 0 }

  const safePage = clampPage(page, count, size)
  const start = (safePage - 1) * size + 1
  return { start, end: Math.min(count, start + size - 1) }
}

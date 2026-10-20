/**
 * 后端所有价格字段单位均为「分」（Long）。
 * 展示统一保留两位小数，计算折扣时以整数分为准，避免浮点误差。
 */

export function fenToYuan(fen: number | null | undefined): string {
  if (fen === null || fen === undefined || Number.isNaN(fen)) return '0.00'
  const sign = fen < 0 ? '-' : ''
  const abs = Math.abs(Math.round(fen))
  const yuan = Math.floor(abs / 100)
  const cents = abs % 100
  return `${sign}${yuan}.${cents < 10 ? `0${cents}` : cents}`
}

export function formatPrice(fen: number | null | undefined): string {
  return `¥${fenToYuan(fen)}`
}

/** 元 → 分，用于表单输入（四舍五入到分） */
export function yuanToFen(yuan: number | string | null | undefined): number {
  const value = typeof yuan === 'string' ? Number(yuan) : (yuan ?? 0)
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

/** 折扣率（百分比整数，向下取整）；无有效原价时返回 null */
export function discountRate(originalPrice: number, seckillPrice: number): number | null {
  if (!originalPrice || originalPrice <= 0) return null
  if (seckillPrice < 0 || seckillPrice >= originalPrice) return null
  return Math.floor((seckillPrice / originalPrice) * 100)
}

/** 节省金额（分） */
export function saveAmount(originalPrice: number, seckillPrice: number): number {
  return Math.max(0, originalPrice - seckillPrice)
}

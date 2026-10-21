/**
 * 粒子层配色解析：颜色统一由 CSS 变量提供，换肤时无需改动 canvas 逻辑。
 * 变量缺失或格式非法时回退到默认的宝蓝 / 靛紫。
 */
export interface ParticlePalette {
  toneA: string
  toneB: string
  glow: string
}

export const PARTICLE_FALLBACK: ParticlePalette = {
  toneA: '37, 99, 235',
  toneB: '99, 102, 241',
  glow: 'rgba(29, 78, 216, 0.06)',
}

function toRgbString(r: number, g: number, b: number): string | null {
  const channels = [r, g, b]
  if (channels.some((channel) => !Number.isFinite(channel) || channel < 0 || channel > 255)) {
    return null
  }
  return `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`
}

function parseHex(hex: string): string | null {
  const digits = hex.replace(/^#/, '')
  if (digits.length === 3 || digits.length === 4) {
    const [r, g, b] = [0, 1, 2].map((index) => parseInt(digits[index] + digits[index], 16))
    return toRgbString(r, g, b)
  }
  if (digits.length === 6 || digits.length === 8) {
    const r = parseInt(digits.slice(0, 2), 16)
    const g = parseInt(digits.slice(2, 4), 16)
    const b = parseInt(digits.slice(4, 6), 16)
    return toRgbString(r, g, b)
  }
  return null
}

/**
 * 将 CSS 颜色写成 `r, g, b` 三元组，供 canvas 的 rgba() 拼装使用。
 * 支持 #rgb / #rrggbb / rgb() / rgba() / 逗号或空格分隔的三元组。
 */
export function parseColorToRgb(value: string | null | undefined, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return fallback

  if (raw.startsWith('#')) return parseHex(raw) ?? fallback

  const functional = raw.match(/^rgba?\(([^)]*)\)$/i)
  const body = functional ? functional[1] : raw
  const parts = body
    .split(/[,/\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 3) return fallback
  if (!parts.slice(0, 3).every((part) => /^\d{1,3}$/.test(part))) return fallback

  return toRgbString(Number(parts[0]), Number(parts[1]), Number(parts[2])) ?? fallback
}

/** 读取一次根节点的配色变量；Node 环境（单测）直接返回默认值。 */
export function readParticlePalette(): ParticlePalette {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ...PARTICLE_FALLBACK }
  }

  const styles = window.getComputedStyle(document.documentElement)
  const glow = styles.getPropertyValue('--particle-glow').trim()

  return {
    toneA: parseColorToRgb(styles.getPropertyValue('--particle-tone-1'), PARTICLE_FALLBACK.toneA),
    toneB: parseColorToRgb(styles.getPropertyValue('--particle-tone-2'), PARTICLE_FALLBACK.toneB),
    glow: glow || PARTICLE_FALLBACK.glow,
  }
}

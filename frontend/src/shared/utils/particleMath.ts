export const MAX_LINK_DISTANCE = 130
export const MAX_LINK_COUNT = 220
export const MOUSE_RADIUS = 150
export const MAX_PARTICLE_OFFSET = 18

/** 桌面约 1 个 / 12000px²，60–120 个；移动端始终少于 50 个 */
export function resolveParticleCount(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0
  const area = width * height
  if (width < 768) {
    return Math.min(48, Math.max(24, Math.round(area / 14000)))
  }
  return Math.min(120, Math.max(60, Math.round(area / 12000)))
}

/** 130px 处衰减到 0，最近时最高 0.10 透明度（浅底需更克制的连线） */
export function linkOpacity(distance: number, maxDistance = MAX_LINK_DISTANCE): number {
  if (!Number.isFinite(distance) || maxDistance <= 0) return 0
  if (distance <= 0) return 0.1
  if (distance >= maxDistance) return 0
  return (1 - distance / maxDistance) * 0.1
}

/** 3–6s 周期内 0.1 → 0.42 → 0.1，随机相位由调用方传入 */
export function twinkleAlpha(
  timeSeconds: number,
  periodSeconds: number,
  phase: number,
  low = 0.1,
  high = 0.42,
): number {
  if (!Number.isFinite(timeSeconds) || !Number.isFinite(periodSeconds) || periodSeconds <= 0) {
    return low
  }
  const cycle = ((timeSeconds / periodSeconds + phase) % 1 + 1) % 1
  const wave = 0.5 - 0.5 * Math.cos(cycle * Math.PI * 2)
  return low + (high - low) * wave
}

/** 鼠标 150px 内的排斥力，距离越近越强，方向由粒子指向鼠标外侧 */
export function repulsionForce(
  dx: number,
  dy: number,
  radius = MOUSE_RADIUS,
  strength = 0.55,
): { x: number; y: number } {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || radius <= 0) return { x: 0, y: 0 }
  const distance = Math.hypot(dx, dy)
  if (distance === 0 || distance >= radius) return { x: 0, y: 0 }
  const force = (1 - distance / radius) * strength
  return { x: (dx / distance) * force, y: (dy / distance) * force }
}

/** 将鼠标推开的偏移限制在 ±18px，避免粒子被甩飞 */
export function clampOffset(value: number, max = MAX_PARTICLE_OFFSET): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(-max, Math.min(max, value))
}

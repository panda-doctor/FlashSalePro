import { describe, expect, it } from 'vitest'
import {
  clampOffset,
  linkOpacity,
  repulsionForce,
  resolveParticleCount,
  twinkleAlpha,
} from './particleMath'

describe('particleMath', () => {
  it('桌面粒子数按面积自适应并限制在 60–120', () => {
    expect(resolveParticleCount(1440, 900)).toBe(108)
    expect(resolveParticleCount(3840, 2160)).toBe(120)
    expect(resolveParticleCount(800, 600)).toBe(60)
  })

  it('移动端粒子数始终少于 50', () => {
    for (const [width, height] of [
      [320, 640],
      [375, 900],
      [767, 1200],
    ]) {
      const count = resolveParticleCount(width, height)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(50)
    }
  })

  it('非法尺寸返回 0', () => {
    expect(resolveParticleCount(0, 800)).toBe(0)
    expect(resolveParticleCount(Number.NaN, 800)).toBe(0)
  })

  it('连线透明度随距离线性衰减', () => {
    expect(linkOpacity(0)).toBeCloseTo(0.1)
    expect(linkOpacity(65)).toBeCloseTo(0.05)
    expect(linkOpacity(130)).toBe(0)
    expect(linkOpacity(400)).toBe(0)
  })

  it('闪烁透明度落在 0.1–0.42', () => {
    for (let time = 0; time < 12; time += 0.4) {
      const alpha = twinkleAlpha(time, 4.2, 0.37)
      expect(alpha).toBeGreaterThanOrEqual(0.1)
      expect(alpha).toBeLessThanOrEqual(0.42)
    }
  })

  it('排斥力只在半径内产生并随距离减弱', () => {
    expect(repulsionForce(0, 0)).toEqual({ x: 0, y: 0 })
    expect(repulsionForce(150, 0)).toEqual({ x: 0, y: 0 })
    const near = repulsionForce(20, 0)
    const far = repulsionForce(120, 0)
    expect(near.x).toBeGreaterThan(far.x)
    expect(near.y).toBe(0)
  })

  it('偏移被限制在 ±18px', () => {
    expect(clampOffset(100)).toBe(18)
    expect(clampOffset(-100)).toBe(-18)
    expect(clampOffset(4)).toBe(4)
  })
})

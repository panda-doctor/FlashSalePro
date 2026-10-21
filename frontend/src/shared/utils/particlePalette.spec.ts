import { describe, expect, it } from 'vitest'
import { PARTICLE_FALLBACK, parseColorToRgb, readParticlePalette } from './particlePalette'

describe('particlePalette', () => {
  it('解析十六进制颜色', () => {
    expect(parseColorToRgb('#2563eb', PARTICLE_FALLBACK.toneA)).toBe('37, 99, 235')
    expect(parseColorToRgb('#FFFFFF', PARTICLE_FALLBACK.toneA)).toBe('255, 255, 255')
    expect(parseColorToRgb('#abc', PARTICLE_FALLBACK.toneA)).toBe('170, 187, 204')
  })

  it('解析 rgb / rgba 与三元组', () => {
    expect(parseColorToRgb('rgb(99, 102, 241)', PARTICLE_FALLBACK.toneB)).toBe('99, 102, 241')
    expect(parseColorToRgb('rgba(29, 78, 216, 0.06)', PARTICLE_FALLBACK.toneB)).toBe('29, 78, 216')
    expect(parseColorToRgb('37, 99, 235', PARTICLE_FALLBACK.toneB)).toBe('37, 99, 235')
    expect(parseColorToRgb(' 37 99 235 ', PARTICLE_FALLBACK.toneB)).toBe('37, 99, 235')
  })

  it('空值与非法值回退到默认色', () => {
    expect(parseColorToRgb('', PARTICLE_FALLBACK.toneA)).toBe(PARTICLE_FALLBACK.toneA)
    expect(parseColorToRgb(null, PARTICLE_FALLBACK.toneA)).toBe(PARTICLE_FALLBACK.toneA)
    expect(parseColorToRgb(undefined, PARTICLE_FALLBACK.toneB)).toBe(PARTICLE_FALLBACK.toneB)
    expect(parseColorToRgb('tomato', PARTICLE_FALLBACK.toneB)).toBe(PARTICLE_FALLBACK.toneB)
    expect(parseColorToRgb('#12345', PARTICLE_FALLBACK.toneB)).toBe(PARTICLE_FALLBACK.toneB)
    expect(parseColorToRgb('rgb(300, 0, 0)', PARTICLE_FALLBACK.toneB)).toBe(PARTICLE_FALLBACK.toneB)
  })

  it('无 DOM 时读取到默认配色', () => {
    expect(readParticlePalette()).toEqual(PARTICLE_FALLBACK)
  })
})

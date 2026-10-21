import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import {
  MAX_LINK_COUNT,
  MAX_LINK_DISTANCE,
  clampOffset,
  linkOpacity,
  repulsionForce,
  resolveParticleCount,
  twinkleAlpha,
} from '@/shared/utils/particleMath'
import { readParticlePalette, type ParticlePalette } from '@/shared/utils/particlePalette'

type ParticleTone = 'toneA' | 'toneB'

interface Particle {
  x: number
  y: number
  size: number
  alpha: number
  driftX: number
  driftY: number
  floatAmp: number
  floatPeriod: number
  floatPhase: number
  twinkle: boolean
  twinklePeriod: number
  twinklePhase: number
  offsetX: number
  offsetY: number
  velocityX: number
  velocityY: number
  tone: ParticleTone
}

interface Point {
  x: number
  y: number
  alpha: number
  tone: ParticleTone
}

const TAU = Math.PI * 2

function between(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function gaussian(): number {
  return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2
}

function createParticles(width: number, height: number, count: number): Particle[] {
  const clusters = Array.from({ length: 4 }, () => ({
    x: between(width * 0.12, width * 0.88),
    y: between(height * 0.08, height * 0.82),
    spread: Math.min(width, height) * between(0.08, 0.16),
  }))

  return Array.from({ length: count }, (_, index) => {
    const clustered = index % 10 < 7
    const cluster = clusters[index % clusters.length]
    const x = clustered
      ? Math.max(16, Math.min(width - 16, cluster.x + gaussian() * cluster.spread))
      : between(16, Math.max(16, width - 16))
    const y = clustered
      ? Math.max(16, Math.min(height - 16, cluster.y + gaussian() * cluster.spread))
      : between(16, Math.max(16, height - 16))
    const speed = between(0.15, 0.4)
    const angle = between(0, TAU)
    const twinkle = Math.random() < 0.35

    return {
      x,
      y,
      size: between(0.6, 2),
      alpha: between(0.1, 0.34),
      driftX: Math.cos(angle) * speed,
      driftY: Math.sin(angle) * speed,
      floatAmp: between(4, 14),
      floatPeriod: between(8, 16),
      floatPhase: between(0, TAU),
      twinkle,
      twinklePeriod: between(3, 6),
      twinklePhase: Math.random(),
      offsetX: 0,
      offsetY: 0,
      velocityX: 0,
      velocityY: 0,
      tone: Math.random() < 0.7 ? 'toneA' : 'toneB',
    }
  })
}

export function useParticleField(canvasRef: Ref<HTMLCanvasElement | null>) {
  let context: CanvasRenderingContext2D | null = null
  let particles: Particle[] = []
  let width = 0
  let height = 0
  let rafId = 0
  let running = false
  let lastFrame = 0
  let elapsed = 0
  let reducedMotion = false
  let visible = true
  let resizeTimer: number | undefined
  let pointerEnabled = false
  let resizeObserver: ResizeObserver | null = null
  let motionQuery: MediaQueryList | null = null
  let palette: ParticlePalette = readParticlePalette()

  const pointer = { x: -9999, y: -9999, active: false }
  const glow = { x: 0, y: 0, ready: false }

  function draw(time: number): void {
    if (!context) return
    context.clearRect(0, 0, width, height)

    if (glow.ready && pointerEnabled) {
      const radius = 150
      const gradient = context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, radius)
      gradient.addColorStop(0, palette.glow)
      gradient.addColorStop(0.45, `rgba(${palette.toneA}, 0.03)`)
      gradient.addColorStop(1, `rgba(${palette.toneA}, 0)`)
      context.fillStyle = gradient
      context.fillRect(glow.x - radius, glow.y - radius, radius * 2, radius * 2)
    }

    const points: Point[] = particles.map((particle) => {
      const alpha = particle.twinkle
        ? twinkleAlpha(time, particle.twinklePeriod, particle.twinklePhase)
        : particle.alpha
      return {
        x: particle.x + particle.offsetX,
        y: particle.y + Math.sin((time / particle.floatPeriod) * TAU + particle.floatPhase) * particle.floatAmp + particle.offsetY,
        alpha,
        tone: particle.tone,
      }
    })

    const linkCounts = new Array(points.length).fill(0)
    let totalLinks = 0

    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]
      if (linkCounts[i] >= 2) continue
      for (let j = i + 1; j < points.length; j += 1) {
        if (linkCounts[j] >= 2) continue
        const b = points[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.hypot(dx, dy)
        if (distance >= MAX_LINK_DISTANCE) continue

        const alpha = linkOpacity(distance) * Math.min(1, (a.alpha + b.alpha) / 0.7)
        if (alpha <= 0.002) continue

        context.beginPath()
        context.moveTo(a.x, a.y)
        context.lineTo(b.x, b.y)
        context.lineWidth = 1
        context.strokeStyle = `rgba(${palette[a.tone]}, ${alpha.toFixed(3)})`
        context.stroke()

        linkCounts[i] += 1
        linkCounts[j] += 1
        totalLinks += 1
        if (totalLinks >= MAX_LINK_COUNT || linkCounts[i] >= 2) break
      }
    }

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i]
      context.beginPath()
      context.arc(point.x, point.y, particles[i].size, 0, TAU)
      context.fillStyle = `rgba(${palette[point.tone]}, ${point.alpha.toFixed(3)})`
      context.fill()
    }
  }

  function step(deltaFactor: number, time: number): void {
    const pointerTarget = pointerEnabled && pointer.active ? pointer : null

    if (pointerTarget) {
      if (!glow.ready) {
        glow.x = pointerTarget.x
        glow.y = pointerTarget.y
        glow.ready = true
      } else {
        glow.x += (pointerTarget.x - glow.x) * 0.08
        glow.y += (pointerTarget.y - glow.y) * 0.08
      }
    }

    for (const particle of particles) {
      particle.x += particle.driftX * deltaFactor
      particle.y += particle.driftY * deltaFactor

      if (particle.x < -24) particle.x = width + 24
      else if (particle.x > width + 24) particle.x = -24
      if (particle.y < -24) particle.y = height + 24
      else if (particle.y > height + 24) particle.y = -24

      if (pointerTarget) {
        const drawX = particle.x + particle.offsetX
        const drawY =
          particle.y +
          Math.sin((time / particle.floatPeriod) * TAU + particle.floatPhase) * particle.floatAmp +
          particle.offsetY
        const force = repulsionForce(drawX - pointerTarget.x, drawY - pointerTarget.y)
        particle.velocityX += force.x * deltaFactor
        particle.velocityY += force.y * deltaFactor
      }

      particle.velocityX += -particle.offsetX * 0.012 * deltaFactor
      particle.velocityY += -particle.offsetY * 0.012 * deltaFactor
      particle.velocityX *= Math.pow(0.92, deltaFactor)
      particle.velocityY *= Math.pow(0.92, deltaFactor)
      particle.offsetX = clampOffset(particle.offsetX + particle.velocityX * deltaFactor)
      particle.offsetY = clampOffset(particle.offsetY + particle.velocityY * deltaFactor)
    }
  }

  function tick(now: number): void {
    if (!running) return
    const delta = Math.min(32, Math.max(8, now - lastFrame))
    lastFrame = now
    elapsed += delta / 1000
    step(delta / 16.6667, elapsed)
    draw(elapsed)
    rafId = requestAnimationFrame(tick)
  }

  function start(): void {
    if (running || reducedMotion || !visible) return
    running = true
    lastFrame = performance.now()
    rafId = requestAnimationFrame(tick)
  }

  function stop(): void {
    running = false
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  function configure(): void {
    const canvas = canvasRef.value
    if (!canvas) return
    width = window.innerWidth
    height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    // 配色只在重排/重建时读取一次，避免每帧 getComputedStyle 触发样式重算
    palette = readParticlePalette()
    particles = createParticles(width, height, resolveParticleCount(width, height))
    pointerEnabled = window.innerWidth >= 768 && window.matchMedia('(pointer: fine)').matches
    glow.ready = false

    if (reducedMotion) draw(0)
  }

  function scheduleResize(): void {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      configure()
      if (reducedMotion) draw(0)
    }, 150)
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointerEnabled || reducedMotion) return
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.active = true
  }

  function onPointerLeave(): void {
    pointer.active = false
    glow.ready = false
  }

  function onVisibilityChange(): void {
    visible = !document.hidden
    if (!visible) stop()
    else start()
  }

  function applyMotionPreference(event?: MediaQueryListEvent): void {
    reducedMotion = event ? event.matches : (motionQuery?.matches ?? false)
    if (reducedMotion) {
      stop()
      pointer.active = false
      glow.ready = false
      draw(0)
    } else {
      start()
    }
  }

  onMounted(() => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion = motionQuery.matches
    configure()
    start()

    motionQuery.addEventListener('change', applyMotionPreference)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)

    resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(document.documentElement)
  })

  onBeforeUnmount(() => {
    stop()
    window.clearTimeout(resizeTimer)
    resizeObserver?.disconnect()
    motionQuery?.removeEventListener('change', applyMotionPreference)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerleave', onPointerLeave)
    context = null
    particles = []
  })
}

import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * 滚动渐显：一次性触发，按 data-reveal-delay 错峰 60ms。
 * 元素初始由 .reveal 隐藏；减少动态或无 IntersectionObserver 时直接显示。
 */
export function useScrollReveal(root?: Ref<HTMLElement | null>): void {
  let observer: IntersectionObserver | null = null
  const timers: number[] = []

  onMounted(() => {
    const scope = root?.value ?? document
    const nodes = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const node = entry.target as HTMLElement
          const delay = Number(node.dataset.revealDelay ?? 0)
          timers.push(
            window.setTimeout(() => {
              node.classList.add('is-visible')
            }, Number.isFinite(delay) ? delay : 0),
          )
          observer?.unobserve(node)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    nodes.forEach((node, index) => {
      if (!node.dataset.revealDelay) node.dataset.revealDelay = String((index % 4) * 60)
      node.style.transitionDelay = `${node.dataset.revealDelay}ms`
      observer?.observe(node)
    })
  })

  onBeforeUnmount(() => {
    timers.forEach((timer) => window.clearTimeout(timer))
    observer?.disconnect()
  })
}

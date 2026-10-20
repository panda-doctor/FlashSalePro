/**
 * 轻量防抖：用于搜索输入等高频触发场景。
 * 返回的函数带 `cancel()`，组件卸载时应调用以清理定时器。
 */
export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void
  cancel(): void
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 300): DebouncedFn<A> {
  let timer: ReturnType<typeof setTimeout> | null = null

  const wrapped = (...args: A): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  return wrapped
}

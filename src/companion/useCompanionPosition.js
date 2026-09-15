import { useEffect, useState } from 'react'
import { canAnimatePlacement, chooseCompanionPlacement } from './placement.js'

function box(element) {
  if (!element) return null
  const r = element.getBoundingClientRect()
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
}

const avoidSelector = '[data-companion-obstacle], .navbar, .scanner-nav, .visitor-counter, input, select, button, a, h1, h2, h3, p, [role="dialog"], .share-card-wrap'

export function useCompanionPosition({ minimized, dispatch }) {
  const [placement, setPlacement] = useState({ mode: 'hidden', left: 0, top: 0, width: 0, height: 0 })

  useEffect(() => {
    let frame = 0
    let previous
    let activeSection = ''
    let lastUpdate = 0
    let throttle
    const update = () => {
      frame = 0
      lastUpdate = performance.now()
      const width = document.documentElement.clientWidth
      const height = window.innerHeight
      const sections = [...document.querySelectorAll('[data-companion-section]')]
      const section = sections.find((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= height * 0.55 && r.bottom > height * 0.3
      }) || sections[0]
      if (section && activeSection !== section.dataset.companionSection) {
        activeSection = section.dataset.companionSection
        dispatch({ type: 'SECTION', section: activeSection })
      }
      const editing = width < 800 && document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')
      const keyboard = window.visualViewport && window.visualViewport.height < height * 0.72
      const modal = [...document.querySelectorAll('[role="dialog"], dialog[open], .share-card-overlay')]
        .some((el) => el.getBoundingClientRect().height > 0)
      const obstacles = [...document.querySelectorAll(avoidSelector)]
        .filter((el) => !el.closest('[data-companion-root]'))
        .map(box).filter((r) => r.width && r.height && r.bottom > 0 && r.top < height)
      const next = chooseCompanionPlacement({ width, height, obstacles, previous, minimized,
        anchor: box(document.querySelector('[data-companion-anchor]')),
        dock: box(document.querySelector('[data-companion-dock]')),
        preferredSide: section?.dataset.companionSide || 'right',
        hidden: Boolean(editing || keyboard || modal || section?.dataset.companionAllow === 'false'),
      })
      if (!previous || ['mode', 'left', 'top', 'width', 'height'].some((key) => previous[key] !== next[key])) {
        next.animate = canAnimatePlacement(previous, next, obstacles)
        if (previous?.mode === 'floating' && next.mode === 'floating' && previous.side !== next.side) dispatch({ type: 'MOVE' })
        previous = next
        setPlacement(next)
      }
    }
    const schedule = () => {
      if (frame || throttle) return
      const elapsed = performance.now() - lastUpdate
      if (elapsed < 75) {
        throttle = window.setTimeout(() => { throttle = 0; frame = requestAnimationFrame(update) }, 75 - elapsed)
      } else frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)
    document.querySelectorAll('[data-companion-anchor], [data-companion-dock]').forEach((el) => observer.observe(el))
    const mutation = new MutationObserver(schedule)
    mutation.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'aria-modal'] })
    const intersections = new IntersectionObserver(schedule, { threshold: [0, 0.5, 1] })
    document.querySelectorAll('[data-companion-section]').forEach((el) => intersections.observe(el))
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    document.addEventListener('focusin', schedule)
    document.addEventListener('focusout', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(throttle)
      observer.disconnect()
      mutation.disconnect()
      intersections.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      document.removeEventListener('focusin', schedule)
      document.removeEventListener('focusout', schedule)
    }
  }, [minimized, dispatch])

  return placement
}

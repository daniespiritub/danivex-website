export function intersects(a, b, gap = 8) {
  return a.left < b.right + gap && a.right > b.left - gap
    && a.top < b.bottom + gap && a.bottom > b.top - gap
}

function rect(left, top, width, height) {
  return { left, top, width, height, right: left + width, bottom: top + height }
}

export function canAnimatePlacement(previous, next, obstacles = []) {
  if (previous?.mode !== 'floating' || next.mode !== 'floating') return false
  const left = Math.min(previous.left, next.left)
  const top = Math.min(previous.top, next.top)
  const swept = rect(left, top, Math.max(previous.right, next.right) - left, Math.max(previous.bottom, next.bottom) - top)
  return !obstacles.some((obstacle) => intersects(swept, obstacle))
}

export function chooseCompanionPlacement({ width, height, anchor, dock, obstacles = [],
  preferredSide = 'right', previous, hidden = false, minimized = false }) {
  if (hidden || height < 280) return { mode: 'hidden', left: 0, top: 0, width: 0, height: 0 }
  const docked = { mode: 'dock', ...(dock || rect(width - 60, 14, 40, 40)) }
  if (minimized) return docked
  if (anchor && anchor.top >= 64 && anchor.bottom <= height - 8) {
    return { ...anchor, mode: 'hero', side: 'right' }
  }
  const w = width < 700 ? 100 : 120
  const h = width < 700 ? 148 : 196
  const top = height - h - 60
  const safe = (box) => box.left >= 8 && box.right <= width - 8 && box.top >= 80
    && box.bottom <= height - 60 && !obstacles.some((obstacle) => intersects(box, obstacle))
  // Stay at the lower edge, including after a resize. Never jump to mid-page.
  if (previous?.mode === 'floating' && previous.width === w && previous.top === top && safe(previous)) return previous
  const sides = preferredSide === 'left' ? ['left', 'right'] : ['right', 'left']
  for (const side of sides) {
    const box = rect(side === 'left' ? 12 : width - w - 12, top, w, h)
    if (safe(box)) return { ...box, mode: 'floating', side }
  }
  return docked
}

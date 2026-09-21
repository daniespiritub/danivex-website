const profiles = {
  portrait: { centerX: .15, centerY: 2.95, span: 2.6 },
  full: { centerX: 0, centerY: 1.9, span: 4.25 },
}

export function getCompanionFraming(name, aspect = 1) {
  const { centerX, centerY, span } = profiles[name] || profiles.full
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  return { centerX, centerY, top: span / 2, bottom: -span / 2, left: -span * ratio / 2, right: span * ratio / 2 }
}

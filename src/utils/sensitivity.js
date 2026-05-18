const baseByTier = {
  entry: 124,
  budget: 134,
  mid: 144,
  upper: 154,
  flagship: 164,
  gaming: 178,
  tablet: 148,
  ipad: 156,
}

function clamp(value, min = 0, max = 200) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function effectiveAge(device, requested) {
  if (requested !== 'auto') return requested
  if (device.tier === 'gaming') return 'gaming'
  if (device.name.match(/\b(8|9|10|11|12|A10|A11|A12|A20|A30|S8|S9|Mi Pad 4)\b/i)) {
    return 'old'
  }
  return 'new'
}

export function calculateSensitivity(device, profile, tierLabels) {
  let base = baseByTier[device.tier] || 142
  const reasons = []
  const age = effectiveAge(device, profile.ageTier)

  if (device.hz >= 165) base += 8
  else if (device.hz >= 144) base += 6
  else if (device.hz >= 120) base += 4
  else if (device.hz >= 90) base += 2
  else base -= 3

  if (device.type === 'tablet') base -= device.tier === 'ipad' ? 3 : 7
  if (device.os === 'iOS' || device.os === 'iPadOS') base += 3
  if (device.tier === 'gaming') base += 6

  if (profile.rootState === 'root' && device.os === 'Android') base += 4
  if (profile.rootState === 'no-root' && device.os === 'Android') base -= 1
  if (profile.gameVersion === 'ffmax' && ['entry', 'budget'].includes(device.tier)) base -= 4

  if (age === 'old') base -= 10
  if (age === 'gaming') base += 4

  base += Math.min(10, profile.years * 1.15)

  if (profile.dpi >= 650) base += 7
  else if (profile.dpi >= 520) base += 5
  else if (profile.dpi >= 430) base += 2
  else if (profile.dpi > 0 && profile.dpi < 360) base -= 4

  if (profile.fireButton < 42) base += 4
  else if (profile.fireButton > 62) base -= 5
  else base += 1

  if (profile.fpsTarget !== 'auto') {
    const fps = Number(profile.fpsTarget)
    if (fps >= 144) base += 4
    else if (fps >= 120) base += 3
    else if (fps <= 60 && device.hz >= 120) base -= 2
  }

  if (profile.style === 'aggressive') base += 8
  if (profile.style === 'precise') base -= 8

  reasons.push(`${device.name} se trata como ${tierLabels[device.tier] || device.tier}.`)
  reasons.push(`${device.hz}Hz ajusta la base por respuesta tactil.`)
  if (age === 'old') reasons.push('El modo antiguo baja sensibilidad para evitar saltos.')
  if (device.tier === 'gaming') reasons.push('La categoria gaming permite valores mas agresivos.')
  if (profile.rootState === 'root' && device.os === 'Android') {
    reasons.push('Root suma margen por menor latencia configurable.')
  }
  if (profile.style === 'precise') reasons.push('El estilo preciso reduce la levantada para ganar control.')
  if (profile.style === 'aggressive') reasons.push('El estilo agresivo sube la levantada.')

  const general = clamp(base)
  const values = {
    general,
    redDot: clamp(general - 5),
    scope2x: clamp(general - 14),
    scope4x: clamp(general - 27),
    sniper: clamp(general - 43),
  }

  return { values, reasons, age }
}

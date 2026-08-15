/*
  Comparacion de dos jugadores (roadmap: Comparison). Funcion PURA y testeable.
  Solo compara datos reales presentes; no inventa. En metricas numericas marca
  quien lidera ('a' | 'b' | 'tie'); en filas informativas no hay lider.
*/

function num(value) {
  // Los conteos de FF usan '.' como separador de miles (11.074.588). Se dejan
  // solo digitos para no romper el parseo.
  return Number(String(value ?? '').replace(/[^\d]/g, '')) || 0
}

function metricRow(label, a, b) {
  const na = num(a)
  const nb = num(b)
  const leader = na === nb ? 'tie' : na > nb ? 'a' : 'b'
  return { label, a: a ?? '', b: b ?? '', leader, numeric: true }
}

function infoRow(label, a, b) {
  return { label, a: a || '', b: b || '', leader: null, numeric: false }
}

export function comparePlayers(a, b) {
  if (!a || !b) return []
  return [
    metricRow('Nivel', a.level, b.level),
    metricRow('Me gusta', a.likes, b.likes),
    metricRow('Experiencia', a.exp, b.exp),
    infoRow('Region', a.region, b.region),
    infoRow('Antiguedad', a.accountAge, b.accountAge),
    infoRow('Clan', a.clan, b.clan),
    infoRow('Cuenta creada', a.creationDate, b.creationDate),
  ]
}

// Devuelve 'a' | 'b' | 'tie' segun quien lidera mas metricas numericas.
export function compareSummary(rows) {
  let a = 0
  let b = 0
  for (const row of rows) {
    if (row.leader === 'a') a += 1
    else if (row.leader === 'b') b += 1
  }
  if (a === b) return 'tie'
  return a > b ? 'a' : 'b'
}

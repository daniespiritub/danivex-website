/*
  DaniVex AI — lectura determinista (sin LLM).

  Genera un resumen en lenguaje natural a partir de datos YA normalizados
  (perfil publico + historial de cambios). Respeta la regla de la vision: la IA
  NO es fuente de datos ni inventa nada; solo describe lo que existe. Una version
  con LLM real es una mejora futura (requiere credencial) que consumiria esta
  misma capa de datos, nunca al reves.
*/

const CHANGE_PHRASES = {
  LEVEL_UP: 'subio de nivel',
  LEVEL_CHANGED: 'cambio de nivel',
  NICKNAME_CHANGED: 'cambio su nick',
  GUILD_CHANGED: 'cambio de gremio',
  LIKES_CHANGED: 'vario sus me gusta',
  AVATAR_CHANGED: 'cambio su avatar',
  BANNER_CHANGED: 'cambio su banner',
  BIO_CHANGED: 'actualizo su biografia',
  PRIME_CHANGED: 'cambio su nivel Prime',
  REGION_CHANGED: 'cambio de region',
}

function joinList(items) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

export function buildDaniVexAiRead(player, events = []) {
  if (!player || player.lookupStatus !== 'real') {
    return 'DaniVex no encontro un perfil publico para este UID. No se generan lecturas sobre datos no verificados.'
  }

  const parts = [`DaniVex analizo la cuenta ${player.username} (UID ${player.uid}).`]

  const facts = []
  if (player.region) facts.push(`region ${player.region}`)
  if (player.level) facts.push(`nivel ${player.level}`)
  if (player.likes) facts.push(`${new Intl.NumberFormat('es').format(player.likes)} me gusta`)
  if (player.accountAge && player.accountAge !== 'No disponible') facts.push(`${player.accountAge} de antiguedad`)
  if (facts.length) parts.push(`Datos publicos: ${joinList(facts)}.`)

  if (player.clan) parts.push(`Pertenece al gremio ${player.clan}${player.clanId ? ` (ID ${player.clanId})` : ''}.`)

  const uniquePhrases = [...new Set((events || []).map((e) => CHANGE_PHRASES[e.type]).filter(Boolean))]
  if (uniquePhrases.length) {
    parts.push(`Cambios recientes observados por DaniVex: ${joinList(uniquePhrases)}.`)
  }

  parts.push('Estos datos provienen de fuentes publicas y del historial almacenado por DaniVex; la IA no inventa informacion.')
  return parts.join(' ')
}

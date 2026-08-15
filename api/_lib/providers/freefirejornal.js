/*
  Proveedor FreeFireJornal (perfil). Interface PlayerDataProvider.
  Es el proveedor EFECTIVO en produccion (FreeFireMania da 403 desde Vercel).
*/

import { getHtmlWithFetch } from '../http.js'
import { classifyFetchError } from '../log.js'
import { clean, parseNumber } from './text-utils.js'

export const name = 'freefirejornal'
export const label = 'FreeFireJornal Perfil'

export async function getProfile(uid) {
  const sourceUrl = `https://freefirejornal.com/es/perfil-jogador-freefire/${uid}/`
  try {
    const html = await getHtmlWithFetch(sourceUrl)
    const profile = parseFreeFireJornalProfile(html)
    if (profile.nickname) return { ok: true, profile, sourceUrl }
    return { ok: false, outcome: 'empty', sourceUrl }
  } catch (error) {
    return { ok: false, outcome: classifyFetchError(error), error: error.message, sourceUrl }
  }
}

export function parseFreeFireJornalProfile(html) {
  const safeHtml = String(html || '')
  const startIndex = safeHtml.indexOf('<div class="jgff-profile"')
  if (startIndex === -1) return {}

  const endIndex = safeHtml.indexOf('<section class="jgff-search-card">', startIndex)
  const block = safeHtml.slice(startIndex, endIndex === -1 ? startIndex + 20000 : endIndex)

  const facts = {}
  const re = /<div[^>]*><span>([^<]+)<\/span><strong[^>]*>([^<]*)<\/strong>/g
  let m

  while ((m = re.exec(block))) {
    const label = m[1].trim()
    if (!(label in facts)) facts[label] = clean(m[2])
  }

  const nickMatch = block.match(/<h2>([^<]+)<\/h2>/)
  const avatarMatch = block.match(/<img class="jgff-avatar" src="([^"]+)"/i)
  const bannerMatch = block.match(/jgff-profile-cover">\s*<img[^>]+src="([^"]+)"/i)

  return {
    nickname: nickMatch ? clean(nickMatch[1]) : '',
    region: facts['Región'] || '',
    creationDate: facts['Cuenta creada'] || '',
    lastLogin: facts['Último acceso'] || facts['Última vez en línea'] || '',
    gameVersion: facts['Versión del juego'] || '',
    level: facts['Nivel'] || '',
    exp: facts['Experiencia'] || '',
    likes: parseNumber(facts['Likes']),
    clan: facts['Gremio'] || '',
    clanId: facts['ID del clan'] || '',
    emulator: facts['Emulador'] || '',
    elitePass: facts['Pase Élite'] || '',
    season: facts['Temporada'] || '',
    rankBR: facts['Clasificatoria BR'] || '',
    rankCS: facts['Duelo de Escuadras'] || '',
    avatar: avatarMatch ? avatarMatch[1] : '',
    banner: bannerMatch ? bannerMatch[1] : '',
  }
}

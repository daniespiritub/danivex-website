/*
  Proveedor FreeFireMania (perfil). Implementa la interface PlayerDataProvider:
    { name, label, getProfile(uid) }
  getProfile devuelve { ok:true, profile, sourceUrl } o
  { ok:false, outcome:'empty'|'timeout'|'http_error'|'error', error?, sourceUrl }.

  Estado: PROVIDER_DEGRADED en produccion (403 desde IPs de Vercel). Ver
  docs/PROVIDER_STATUS.md. NO se implementan bypasses de anti-bot.
*/

import { getHtmlWithFetch } from '../http.js'
import { classifyFetchError } from '../log.js'
import { clean, cleanBio, htmlToText, normalizeUrl, parseNumber, pick } from './text-utils.js'

export const name = 'freefiremania'
export const label = 'FreeFireMania Fast'

export async function getProfile(uid) {
  const sourceUrl = `https://www.freefiremania.com.br/cuenta/${uid}.html`
  try {
    const html = await getHtmlWithFetch(sourceUrl)
    const profile = parseFreeFireManiaProfile(htmlToText(html), html)
    if (profile.nickname) return { ok: true, profile, sourceUrl }
    return { ok: false, outcome: 'empty', sourceUrl }
  } catch (error) {
    return { ok: false, outcome: classifyFetchError(error), error: error.message, sourceUrl }
  }
}

function parseApiGrid(html) {
  const safeHtml = String(html || '')
  const startIndex = safeHtml.indexOf('<div class="perfil-api-grid">')
  if (startIndex === -1) return {}

  const block = safeHtml.slice(startIndex, startIndex + 2000)
  const out = {}
  const re = /<div><strong>([^<]+)<\/strong><span[^>]*>([\s\S]*?)<\/span><\/div>/g
  let m

  while ((m = re.exec(block))) {
    out[m[1].trim()] = clean(m[2].replace(/<[^>]+>/g, ' '))
  }

  return out
}

function parseClanPanel(html) {
  const safeHtml = String(html || '')
  const startIndex = safeHtml.indexOf('<h2>Clan</h2>')
  if (startIndex === -1) return {}

  const block = safeHtml.slice(startIndex, startIndex + 600)
  const nameMatch = block.match(/<a[^>]*>([^<]+)<\/a>/i)
  const idMatch = block.match(/ID del Clan:\s*(\d+)/i)
  const levelMembersMatch = block.match(/Nivel:\s*(\d+)\s*\|\s*Miembros:\s*(\d+)/i)

  if (!nameMatch) return {}

  return {
    clan: clean(nameMatch[1]),
    clanId: idMatch ? idMatch[1] : '',
    clanLevel: levelMembersMatch ? levelMembersMatch[1] : '',
    clanMembers: levelMembersMatch ? levelMembersMatch[2] : '',
  }
}

function parseExactAge(html) {
  const match = String(html || '').match(/y tiene\s+(\d+\s+a[nñ]os?,\s*\d+\s+mes(?:es)?\s+y\s+\d+\s+d[ií]as)/i)
  return match ? match[1].replace(/\s+/g, ' ').trim() : ''
}

function parseAccountLevel(html) {
  const match = String(html || '').match(/class="level">(\d+)<\/div>/i)
  return match ? match[1] : ''
}

function parseVerifiedBio(html) {
  const match = String(html || '').match(/id="bioContent"\s+data-original-bio="([^"]*)"/i)
  if (!match) return ''

  return match[1]
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

export function parseFreeFireManiaProfile(text, html) {
  const apiGrid = parseApiGrid(html)
  const clanFromPanel = parseClanPanel(html)
  const exactAge = parseExactAge(html)
  const bioFromAttr = parseVerifiedBio(html)
  const accountLevel = parseAccountLevel(html)

  const nickname =
    pick(text, [
      /Nick:\s*([^\n]+)/i,
      /Nombre:\s*([^\n]+)/i,
      /Jogador:\s*([^\n]+)/i,
      /Jugador:\s*([^\n]+)/i,
      /Informaci[oó]n de:\s*([^\n]+)/i,
      /Perfil del Jugador\s+([^\n]+)/i,
    ])

  const creationDate =
    pick(text, [
      /Cuenta creada el:\s*([^\n]+)/i,
      /Fecha de Creaci[oó]n:\s*([^\n]+)/i,
      /Data de cria[cç][aã]o:\s*([^\n]+)/i,
      /Criada em:\s*([^\n]+)/i,
    ])

  const lastLogin =
    pick(text, [
      /[UÚ]ltimo inicio de sesi[oó]n el:\s*([^\n]+)/i,
      /[UÚ]ltima vez online:\s*([^\n]+)/i,
      /[UÚ]ltimo login:\s*([^\n]+)/i,
      /[UÚ]ltimo acesso:\s*([^\n]+)/i,
    ])

  const gameVersion =
    pick(text, [
      /Versi[oó]n del juego:\s*([^\n]+)/i,
      /Version del juego:\s*([^\n]+)/i,
      /Vers[aã]o do jogo:\s*([^\n]+)/i,
    ])

  const level =
    pick(text, [
      /Nivel:\s*([0-9]+)/i,
      /N[ií]vel:\s*([0-9]+)/i,
      /Level:\s*([0-9]+)/i,
    ])

  const exp =
    pick(text, [
      /Exp:\s*([0-9.,]+)/i,
      /Experiencia:\s*([0-9.,]+)/i,
      /Experi[eê]ncia:\s*([0-9.,]+)/i,
    ])

  const likes =
    parseNumber(
      pick(text, [
        /Me gusta:\s*([0-9.,]+)/i,
        /Curtidas:\s*([0-9.,]+)/i,
        /Likes:\s*([0-9.,]+)/i,
      ]),
    )

  const pass =
    pick(text, [
      /Pase Booyah:\s*([^\n]+)/i,
      /Passe Booyah:\s*([^\n]+)/i,
      /Booyah Pass:\s*([^\n]+)/i,
    ])

  const region =
    pick(text, [
      /Regi[oó]n:\s*([^\n]+)/i,
      /Region:\s*([^\n]+)/i,
      /Regi[aã]o:\s*([^\n]+)/i,
    ])

  const clan =
    pick(text, [
      /Clan:\s*([^\n]+)/i,
      /Guilda:\s*([^\n]+)/i,
      /Cl[aã]:\s*([^\n]+)/i,
    ])

  const clanId =
    pick(text, [
      /Clan ID:\s*([0-9]+)/i,
      /ID del clan:\s*([0-9]+)/i,
      /Guild ID:\s*([0-9]+)/i,
      /ID da guilda:\s*([0-9]+)/i,
    ])

  const clanLevel =
    pick(text, [
      /Nivel de clan:\s*([0-9]+)/i,
      /N[ií]vel do cl[aã]:\s*([0-9]+)/i,
      /N[ií]vel da guilda:\s*([0-9]+)/i,
      /Nivel:\s*([0-9]+)\s*Miembros/i,
    ])

  const clanMembers =
    pick(text, [
      /Miembros:\s*([0-9]+)/i,
      /Membros:\s*([0-9]+)/i,
      /Integrantes:\s*([0-9]+)/i,
    ])

  const bio =
    cleanBio(
      pick(text, [
        /Biograf[ií]a:\s*([\s\S]*?)(?:Copiar|Perfil actualizado|Perfil atualizado|Antig[uü]edad|Otras herramientas|$)/i,
        /Bio:\s*([\s\S]*?)(?:Copiar|Perfil actualizado|Perfil atualizado|Antig[uü]edad|Otras herramientas|$)/i,
      ]),
    )

  const skinStatus =
    pick(text, [
      /Skin:\s*([^\n]+)/i,
    ]) ||
    (text.toLowerCase().includes('error al cargar la información de la skin')
      ? 'Error al cargar skin'
      : text.toLowerCase().includes('mostrar skin del jugador')
        ? 'Mostrar skin del jugador'
        : '')

  const skinError = text.toLowerCase().includes('error al cargar la información de la skin')
    ? 'Error al cargar la informacion de la skin.'
    : ''

  const avatar =
    normalizeUrl(
      pick(html, [
        /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|title)=["'][^"']*(?:Avatar|perfil|player|jugador)[^"']*["']/i,
        /(?:avatar|profile)[^"']*["']\s*src=["']([^"']+)["']/i,
      ]),
    )

  const banner =
    normalizeUrl(
      pick(html, [
        /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|title)=["'][^"']*(?:banner|profile)[^"']*["']/i,
      ]),
    )

  return {
    nickname: clean(apiGrid['Nick']) || clean(nickname),
    region: clean(apiGrid['Región']) || clean(region) || 'SAC',
    creationDate: clean(apiGrid['Cuenta creada el']) || clean(creationDate),
    lastLogin: clean(apiGrid['Último inicio de sesión']) || clean(lastLogin),
    gameVersion: clean(apiGrid['Versión del juego']) || clean(gameVersion),
    level: accountLevel || clean(level),
    exp: clean(apiGrid['Exp']) || clean(exp),
    likes: apiGrid['Me gusta'] ? parseNumber(apiGrid['Me gusta']) : likes,
    pass: clean(apiGrid['Pase Booyah']) || clean(pass),
    verified: apiGrid['Verificado'] ? /^s[ií]$/i.test(apiGrid['Verificado']) : null,
    accountAge: exactAge,
    clan: clanFromPanel.clan || clean(clan),
    clanId: clanFromPanel.clanId || clean(clanId),
    clanLevel: clanFromPanel.clanLevel || clean(clanLevel),
    clanMembers: clanFromPanel.clanMembers || clean(clanMembers),
    bio: bioFromAttr || bio,
    skinStatus: clean(skinStatus),
    skinError,
    avatar,
    banner,
  }
}

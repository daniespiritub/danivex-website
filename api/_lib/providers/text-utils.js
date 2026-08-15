// Utilidades de parseo de texto compartidas por los proveedores de perfil.
// Movidas desde free-fire-uid.js sin cambios de comportamiento (Provider Layer).

export function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/h1>|<\/h2>|<\/h3>|<\/section>|<\/article>|<\/tr>/gi, '\n')
    .replace(/<\/td>|<\/th>/gi, ': ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}

export function pick(value, patterns) {
  for (const pattern of patterns) {
    const match = String(value || '').match(pattern)

    if (match?.[1]) {
      return match[1]
        .replace(/\s+/g, ' ')
        .trim()
    }
  }

  return ''
}

export function parseNumber(value) {
  return Number(String(value || '').replace(/[^\d]/g, '') || 0)
}

export function clean(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/Copiar código de Biografía/i, '')
    .replace(/¡Biografía Copiada!/i, '')
    .trim()
}

export function cleanBio(value) {
  return clean(value)
    .replace(/Perfil actualizado el:.*/i, '')
    .replace(/Perfil atualizado em:.*/i, '')
    .trim()
}

export function normalizeUrl(value) {
  const cleaned = clean(value)
  if (!cleaned) return ''

  try {
    return new URL(cleaned, 'https://www.freefiremania.com.br').toString()
  } catch {
    return ''
  }
}

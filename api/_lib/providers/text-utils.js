import { parseFragment } from 'parse5'

const lineBreakTags = new Set(['p', 'div', 'li', 'h1', 'h2', 'h3', 'section', 'article', 'tr'])
const ignoredTags = new Set(['script', 'style', 'template'])

export function htmlToText(html) {
  // Extract plain text, not safe HTML. Consumers must still escape it when rendering.
  const parts = []
  const stack = [{ node: parseFragment(String(html || '')), closing: false }]
  while (stack.length) {
    const { node, closing } = stack.pop()
    const tag = node.tagName
    if (closing) {
      parts.push(lineBreakTags.has(tag) ? '\n' : ['td', 'th'].includes(tag) ? ': ' : ' ')
    } else if (node.nodeName === '#text') {
      parts.push(node.value)
    } else if (ignoredTags.has(tag) || tag === 'br') {
      parts.push('\n')
    } else if (node.childNodes) {
      if (tag) parts.push(' ')
      stack.push({ node, closing: true })
      for (let i = node.childNodes.length - 1; i >= 0; i--) stack.push({ node: node.childNodes[i], closing: false })
    }
  }
  return parts.join('')
    .replace(/\u00a0/g, ' ')
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

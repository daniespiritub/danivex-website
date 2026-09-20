import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { isIP } from 'node:net'
import { PROFILE_IMAGE_HOST, PROFILE_IMAGE_NAME } from '../../src/utils/scannerImages.js'

export const IMAGE_MAX_BYTES = 512 * 1024
export const IMAGE_TIMEOUT_MS = 5000

export function isPublicIPv4(address) {
  if (isIP(address) !== 4) return false
  const [a, b, c] = address.split('.').map(Number)
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113))
}

export function publicImageLookup(resolve = lookup) {
  return (hostname, options, callback) => {
    if (hostname !== PROFILE_IMAGE_HOST) return callback(new Error('image_host_denied'))
    // Validate the addresses actually used by the socket, not a separate DNS preflight.
    // IPv6 (including IPv4-mapped addresses) is deliberately not used by this proxy.
    Promise.resolve().then(() => resolve(hostname, { family: 4, all: true })).then((addresses) => {
      if (!addresses.length || addresses.some(({ address, family }) => family !== 4 || !isPublicIPv4(address))) {
        return callback(new Error('image_address_denied'))
      }
      const first = addresses[0]
      if (options?.all) callback(null, [first])
      else callback(null, first.address, 4)
    }, () => callback(new Error('image_dns_failed')))
  }
}

export function validatePng(buffer) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ||
      buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR') return false
  const width = buffer.readUInt32BE(16)
  const height = buffer.readUInt32BE(20)
  return width > 0 && height > 0 && width <= 4096 && height <= 4096
}

export async function fetchProfileImage(name, { transport = request, resolve = lookup, timeoutMs = IMAGE_TIMEOUT_MS } = {}) {
  if (typeof name !== 'string' || !PROFILE_IMAGE_NAME.test(name)) throw new Error('image_name_denied')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await new Promise((accept, reject) => {
      const req = transport({
        protocol: 'https:', hostname: PROFILE_IMAGE_HOST, port: 443,
        path: `/images/itens/${name}`, method: 'GET', agent: false,
        lookup: publicImageLookup(resolve), family: 4, signal: controller.signal,
        headers: { Accept: 'image/png', 'Accept-Encoding': 'identity', 'User-Agent': 'DaniVex-Profile-Images/1.0' },
      }, accept)
      req.on('error', reject)
      req.end()
    })
    // No redirects are followed, including redirects back to the allowlisted host.
    if (response.statusCode !== 200) throw new Error('image_upstream_status')
    if (String(response.headers['content-type']).split(';')[0].trim().toLowerCase() !== 'image/png') throw new Error('image_type_denied')
    if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') throw new Error('image_encoding_denied')
    const length = response.headers['content-length']
    if (length !== undefined && (!/^\d+$/.test(length) || Number(length) > IMAGE_MAX_BYTES)) throw new Error('image_too_large')
    const chunks = []
    let size = 0
    for await (const chunk of response) {
      size += chunk.length
      if (size > IMAGE_MAX_BYTES) throw new Error('image_too_large')
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks, size)
    if (!validatePng(body)) throw new Error('image_content_denied')
    return body
  } finally {
    clearTimeout(timer)
    response?.destroy()
  }
}

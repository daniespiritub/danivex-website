export const PROFILE_IMAGE_HOST = 'www.freefiremania.com.br'
export const PROFILE_IMAGE_NAME = /^[A-Za-z0-9_-]{1,160}\.png$/

// Old cached profiles also pass through here; no cache purge is necessary.
export function scannerProfileImage(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    const name = url.pathname.slice('/images/itens/'.length)
    if (url.protocol === 'https:' && url.hostname === PROFILE_IMAGE_HOST && !url.port &&
        !url.username && !url.password && !url.search && !url.hash &&
        url.pathname.startsWith('/images/itens/') && PROFILE_IMAGE_NAME.test(name)) {
      return `/api/profile-image?asset=${encodeURIComponent(name)}`
    }
  } catch { /* Other existing image sources are not proxied. */ }
  return value
}

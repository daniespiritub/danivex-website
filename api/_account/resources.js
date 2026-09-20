import { mobilador } from '../../src/data/ecosystem.js'

export const resources = Object.freeze({
  sensitivity: { id: 'sensitivity', type: 'tool', title: 'Sensibilidad FF', href: '/#sensibilidad' },
  scanner: { id: 'scanner', type: 'tool', title: 'Player Scanner', href: '/player-scanner' },
  mobilador: { id: 'mobilador', type: 'download', title: mobilador.name, href: '/#mobilador', version: mobilador.version, download: mobilador.downloadUrl },
})
export const reservedHandles = new Set('admin administrator root support staff official danivex vexa api auth account login register signup signin settings android modules download downloads security verify system'.split(' '))
export function validHandle(handle) { return typeof handle === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(handle) && !reservedHandles.has(handle.toLowerCase()) }
export function normalizeHandle(handle) { return validHandle(handle) ? handle.toLowerCase() : null }

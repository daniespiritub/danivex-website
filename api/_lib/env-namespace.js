/*
  Aislamiento de datastore por entorno.

  Production, Preview y Development comparten el MISMO Upstash/Redis (una sola
  integracion conectada a los 3 entornos). Sin aislamiento, un deploy de preview
  o un `vercel dev` local escriben en el mismo Redis que produccion: inflan el
  contador de visitas, ensucian la cache de perfiles y comparten ventanas de
  rate-limit.

  Solucion: prefijar TODAS las claves con el namespace del entorno, derivado de
  VERCEL_ENV (lo setea Vercel: 'production' | 'preview' | 'development'; en
  `vercel dev` es 'development'). Default seguro 'dev' si no esta definido, para
  NUNCA escribir por accidente en el namespace de produccion.
*/

export function envNamespace() {
  switch (process.env.VERCEL_ENV) {
    case 'production':
      return 'prod'
    case 'preview':
      return 'preview'
    default:
      return 'dev'
  }
}

// Prefija una clave con el namespace del entorno: nsKey('danivex:visits') =>
// 'prod:danivex:visits' en produccion, 'dev:danivex:visits' en local, etc.
export function nsKey(key) {
  return `${envNamespace()}:${key}`
}

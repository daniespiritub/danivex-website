/*
  Logging estructurado DaniVex. Emite una linea JSON a stdout, que Vercel
  captura en los logs de la funcion. Sin dependencias.

  Reglas de privacidad:
    - NO se registran secretos ni tokens.
    - NO se registra la IP del cliente.
    - El UID SI se registra: es un identificador publico de Free Fire
      (no PII) y es necesario para diagnosticar fallos por-consulta.
*/

export function logEvent(event, fields = {}) {
  try {
    console.log(JSON.stringify({ t: new Date().toISOString(), svc: 'danivex', event, ...fields }))
  } catch {
    // El logging nunca debe romper una request.
  }
}

// Clasifica el error de un fetch de proveedor para observabilidad.
export function classifyFetchError(error) {
  if (!error) return 'error'
  if (error.name === 'AbortError') return 'timeout'
  if (typeof error.message === 'string' && /^HTTP \d+/.test(error.message)) return 'http_error'
  return 'error'
}

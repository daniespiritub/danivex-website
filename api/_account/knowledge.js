export const knowledge = [
  { title: 'Sensibilidad FF', url: 'https://danivex.com/#sensibilidad', text: 'Genera una base orientativa entre 0 y 200. Elige Android, iOS o Tablet, busca el modelo o usa la gama manual. Estado Android, DPI y FPS solo corresponden a Android. DE es Duelo de Escuadras; BR es Battle Royale. Prueba y ajusta los valores en entrenamiento. No promete headshots ni cambia archivos del juego.' },
  { title: 'Player Scanner', url: 'https://danivex.com/player-scanner', text: 'Consulta informacion publica por UID. Depende de proveedores externos y datos observados; no requiere contrasena de Free Fire. No puede garantizar diamantes comprados, fecha exacta de creacion ni sanciones cuando la fuente no aporta el dato. Un error del proveedor no demuestra que una cuenta no exista.' },
  { title: 'DaniVex Mobilador', url: 'https://danivex.com/#mobilador', text: 'Producto publicado: DaniVex Mobilador 0.0.0.1 para Windows 64 bits. Conecta Android al PC. La descarga oficial esta en GitHub, enlazada en la web. No hay DRM ni descargas privadas actualmente. No inventar compatibilidad de iOS, requisitos o versiones nuevas.' },
  { title: 'Tu cuenta y privacidad', url: 'https://danivex.com/privacy', text: 'La cuenta DaniVex no es una cuenta Garena. Favoritos, guardados y descargas son privados. El historial de chat es opcional y se puede borrar. Descargar registra una solicitud, no confirma instalacion ni finalizacion. Nunca compartas contrasenas ni codigos de acceso. Contacto de comunidad en la home.' },
]
export function retrieve(message, page) {
  const tokens = String(message).toLowerCase().match(/[a-z0-9áéíóúñ]{3,}/g) || []
  return knowledge.map((doc) => ({ ...doc, score: tokens.reduce((n, t) => n + Number(`${doc.title} ${doc.text}`.toLowerCase().includes(t)), 0) + Number(doc.url.endsWith(page)) }))
    .sort((a, b) => b.score - a.score).slice(0, 3).map(({ title, url, text }) => ({ title, url, text }))
}

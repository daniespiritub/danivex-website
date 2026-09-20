import { loadEnv } from 'vite'

const handlers = {
  '/api/auth': () => import('../api/auth.js'),
  '/api/account': () => import('../api/account.js'),
  '/api/assistant': () => import('../api/assistant.js'),
  '/api/player': () => import('../api/player.js'),
  '/api/free-fire-uid': () => import('../api/free-fire-uid.js'),
  '/api/free-fire-prime': () => import('../api/free-fire-prime.js'),
  '/api/free-fire-timeline': () => import('../api/free-fire-timeline.js'),
  '/api/visits': () => import('../api/visits.js'),
}
export function devApi() {
  return {
    name: 'danivex-local-api', apply: 'serve',
    configureServer(server) {
      // Server process only; Vite still exposes only its VITE_ prefix to browsers.
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!handlers[url.pathname]) return next()
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (value) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); return res }
        req.query = Object.fromEntries(url.searchParams)
        try {
          let raw = ''
          for await (const chunk of req) {
            raw += chunk.toString()
            if (Buffer.byteLength(raw) > 16000) return res.status(413).json({ ok: false, error: 'request_too_large' })
          }
          req.body = raw || undefined
          const { default: handler } = await handlers[url.pathname]()
          await handler(req, res)
        } catch { if (!res.headersSent) res.status(503).json({ ok: false, error: 'service_unavailable' }) }
      })
    },
  }
}

// Vista 404 para rutas desconocidas que igual cargan la app (soft-404).
// Marca la vista como noindex via SEO y ofrece la vuelta a la home.
function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        background: '#0a0a0f',
        color: '#f4f4f8',
      }}
    >
      <p style={{ fontSize: '4rem', fontWeight: 800, margin: 0, color: '#a855f7' }}>404</p>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Pagina no encontrada</h1>
      <p style={{ opacity: 0.7, maxWidth: '32ch' }}>
        La pagina que buscas no existe o fue movida.
      </p>
      <a
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.7rem 1.4rem',
          borderRadius: '999px',
          background: '#a855f7',
          color: '#0a0a0f',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        Volver al inicio
      </a>
    </main>
  )
}

export default NotFound

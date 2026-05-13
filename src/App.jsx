import './App.css'
import logo from './assets/logo.png'
import fondo from './assets/fondo-gamer.png'

function App() {
  return (
    <div
      className="page"
      style={{
        backgroundImage: `url(${fondo})`,
      }}
    >
      <nav className="navbar">
        <div className="brand">
          <img src={logo} alt="Danivex Logo" />
          <span>DANIVEX</span>
        </div>

        <div className="menu">
          <a href="#inicio">Inicio</a>
          <a href="#optimizaciones">Optimizaciones</a>
          <a href="#descargas">Descargas</a>
          <a href="#comunidad">Comunidad</a>
          <a href="#contacto">Contacto</a>
        </div>
      </nav>

      <section id="inicio" className="hero">
        <div className="hero-card">
          <img src={logo} alt="Danivex Logo" className="hero-logo" />

          <h1>DANIVEX</h1>

          <p>
            Recursos gamer, optimizaciones legales, guías y herramientas para mejorar tu experiencia de juego.
          </p>

          <div className="buttons">
            <a href="#descargas" className="btn primary">Explorar</a>
            <a href="#comunidad" className="btn secondary">Comunidad</a>
          </div>
        </div>
      </section>

      <section id="optimizaciones" className="section">
        <h2>Optimizaciones</h2>
        <p>Guías para mejorar rendimiento, estabilidad, FPS y configuración de dispositivos.</p>
      </section>

      <section id="descargas" className="section">
        <h2>Descargas legales</h2>
        <p>Archivos, plantillas, overlays y recursos seguros para jugadores y creadores.</p>
      </section>

      <section id="comunidad" className="section">
        <h2>Comunidad</h2>
        <p>Únete a la comunidad Danivex y comparte setups, configuraciones y resultados.</p>
      </section>

      <section id="contacto" className="section">
        <h2>Contacto</h2>
        <p>Próximamente: formulario, Discord y redes oficiales.</p>
      </section>
    </div>
  )
}

export default App
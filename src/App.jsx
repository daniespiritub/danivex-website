import { useMemo, useState } from 'react'
import logo from './assets/logo.png'
import fondo from './assets/fondo-gamer.png'
import { devices, sources, tierLabels } from './data/devices'
import { calculateSensitivity } from './utils/sensitivity'
import './App.css'

const defaultDevice = devices.find((device) => device.name === 'RedMagic 11 Pro') || devices[0]

const defaultProfile = {
  gameVersion: 'ff',
  rootState: 'no-root',
  ageTier: 'auto',
  style: 'balanced',
  years: 2,
  dpi: 400,
  fireButton: 52,
  fpsTarget: 'auto',
}

const resultLabels = [
  ['general', 'General'],
  ['redDot', 'Punto rojo'],
  ['scope2x', 'Mira 2x'],
  ['scope4x', 'Mira 4x'],
  ['sniper', 'Francotirador'],
]

function App() {
  const [search, setSearch] = useState(defaultDevice.name)
  const [selectedDevice, setSelectedDevice] = useState(defaultDevice)
  const [profile, setProfile] = useState(defaultProfile)
  const [copied, setCopied] = useState(false)

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase()
    const defaultNames = ['RedMagic 11 Pro', 'Galaxy A56 5G', 'Galaxy S26 Ultra', 'iPhone 17 Pro Max', 'Xiaomi Pad 7']
    const pool = query
      ? devices.filter((device) => device.search.includes(query))
      : devices.filter((device) => defaultNames.includes(device.name))

    return pool.slice(0, 14)
  }, [search])

  const result = useMemo(
    () => calculateSensitivity(selectedDevice, profile, tierLabels),
    [selectedDevice, profile],
  )

  function updateProfile(key, value) {
    setProfile((current) => ({
      ...current,
      [key]: ['years', 'dpi', 'fireButton'].includes(key) ? Number(value || 0) : value,
    }))
  }

  function selectDevice(device) {
    setSelectedDevice(device)
    setSearch(device.name)
    if ((device.os === 'iOS' || device.os === 'iPadOS') && profile.rootState !== 'ios') {
      updateProfile('rootState', 'ios')
    }
    if (device.os === 'Android' && profile.rootState === 'ios') {
      updateProfile('rootState', 'no-root')
    }
  }

  async function copyPreset() {
    const values = result.values
    const text = [
      `DaniVex Sensibilidad - ${selectedDevice.name}`,
      `General: ${values.general}`,
      `Punto rojo: ${values.redDot}`,
      `Mira 2x: ${values.scope2x}`,
      `Mira 4x: ${values.scope4x}`,
      `Francotirador: ${values.sniper}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page" style={{ backgroundImage: `url(${fondo})` }}>
      <nav className="navbar">
        <div className="brand">
          <img src={logo} alt="Danivex Logo" />
          <span>DANIVEX</span>
        </div>

        <div className="menu">
          <a href="#inicio">Inicio</a>
          <a href="#sensibilidad">Sensibilidad</a>
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
            Recursos gamer, optimizaciones legales, guias y herramientas para mejorar tu experiencia de juego.
          </p>

          <div className="buttons">
            <a href="#sensibilidad" className="btn primary">Calcular sensibilidad</a>
            <a href="#comunidad" className="btn secondary">Comunidad</a>
          </div>
        </div>
      </section>

      <section id="sensibilidad" className="tool-section">
        <div className="section-heading">
          <span>Herramienta principal</span>
          <h2>Generador de sensibilidad Free Fire</h2>
          <p>
            Calcula una base 0-200 segun dispositivo, Hz, DPI, experiencia, boton de disparo,
            root/no root y estilo de juego.
          </p>
        </div>

        <div className="senselab">
          <div className="tool-panel device-panel">
            <div className="panel-head">
              <div>
                <span>Paso 1</span>
                <h3>Dispositivo</h3>
              </div>
              <strong>{devices.length} modelos</strong>
            </div>

            <label className="field full">
              <span>Buscar modelo</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej: iPhone 17, Galaxy A56, RedMagic 11 Pro"
              />
            </label>

            <div className="suggestions" role="listbox" aria-label="Resultados de dispositivos">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((device) => (
                  <button
                    className={`suggestion ${selectedDevice.name === device.name ? 'active' : ''}`}
                    key={device.name}
                    type="button"
                    onClick={() => selectDevice(device)}
                  >
                    <span>
                      <strong>{device.name}</strong>
                      <small>
                        {device.brand} · {device.os} · {device.type === 'tablet' ? 'Tablet' : 'Movil'} · {device.hz}Hz
                      </small>
                    </span>
                    <em>{tierLabels[device.tier]}</em>
                  </button>
                ))
              ) : (
                <div className="empty-state">No encontre ese modelo. Prueba con marca o serie.</div>
              )}
            </div>

            <div className="selected-device">
              <h4>{selectedDevice.name}</h4>
              <div>
                <span>{selectedDevice.brand}</span>
                <span>{selectedDevice.os}</span>
                <span>{selectedDevice.type === 'tablet' ? 'Tablet' : 'Movil'}</span>
                <span>{selectedDevice.hz}Hz</span>
                <span>{selectedDevice.screen}"</span>
                <span>{tierLabels[selectedDevice.tier]}</span>
              </div>
            </div>
          </div>

          <div className="tool-panel profile-panel">
            <div className="panel-head">
              <div>
                <span>Paso 2</span>
                <h3>Perfil</h3>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Version</span>
                <select value={profile.gameVersion} onChange={(event) => updateProfile('gameVersion', event.target.value)}>
                  <option value="ff">Free Fire normal</option>
                  <option value="ffmax">Free Fire MAX</option>
                </select>
              </label>

              <label className="field">
                <span>Estado</span>
                <select value={profile.rootState} onChange={(event) => updateProfile('rootState', event.target.value)}>
                  <option value="no-root">No root</option>
                  <option value="root">Root</option>
                  <option value="ios">iOS / iPadOS</option>
                </select>
              </label>

              <label className="field">
                <span>Antiguedad</span>
                <select value={profile.ageTier} onChange={(event) => updateProfile('ageTier', event.target.value)}>
                  <option value="auto">Automatico</option>
                  <option value="old">Antiguo</option>
                  <option value="new">Nuevo</option>
                  <option value="gaming">Gaming</option>
                </select>
              </label>

              <label className="field">
                <span>Estilo</span>
                <select value={profile.style} onChange={(event) => updateProfile('style', event.target.value)}>
                  <option value="balanced">Balanceado</option>
                  <option value="aggressive">Levantada agresiva</option>
                  <option value="precise">Precision estable</option>
                </select>
              </label>

              <label className="field">
                <span>Anos jugando</span>
                <input type="number" min="0" max="15" value={profile.years} onChange={(event) => updateProfile('years', event.target.value)} />
              </label>

              <label className="field">
                <span>DPI dispositivo</span>
                <input type="number" min="0" max="1200" value={profile.dpi} onChange={(event) => updateProfile('dpi', event.target.value)} />
              </label>

              <label className="field">
                <span>Boton disparo</span>
                <input type="number" min="25" max="100" value={profile.fireButton} onChange={(event) => updateProfile('fireButton', event.target.value)} />
              </label>

              <label className="field">
                <span>FPS objetivo</span>
                <select value={profile.fpsTarget} onChange={(event) => updateProfile('fpsTarget', event.target.value)}>
                  <option value="auto">Automatico</option>
                  <option value="60">60 FPS</option>
                  <option value="90">90 FPS</option>
                  <option value="120">120 FPS</option>
                  <option value="144">144 FPS+</option>
                </select>
              </label>
            </div>
          </div>

          <div className="tool-panel result-panel">
            <div className="panel-head">
              <div>
                <span>Resultado</span>
                <h3>Sensibilidad recomendada</h3>
              </div>
              <button type="button" className="copy-btn" onClick={copyPreset}>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="result-grid">
              {resultLabels.map(([key, label]) => (
                <div className="result-card" key={key}>
                  <span>{label}</span>
                  <strong>{result.values[key]}</strong>
                  <small>Escala 0-200</small>
                </div>
              ))}
            </div>

            <div className="bars" aria-label="Grafico de sensibilidad">
              {resultLabels.map(([key, label]) => (
                <div className="bar-row" key={key}>
                  <span>{label}</span>
                  <div><i style={{ width: `${result.values[key] / 2}%` }} /></div>
                  <b>{result.values[key]}</b>
                </div>
              ))}
            </div>

            <p className="coach">
              <strong>Lectura DaniVex:</strong> {result.reasons.join(' ')}
              {' '}Prueba 3 partidas, ajusta de 3 en 3 y guarda el mejor resultado.
            </p>
          </div>
        </div>

        <div className="source-row">
          {sources.map((source) => (
            <a href={source.url} key={source.name} target="_blank" rel="noreferrer">
              {source.name}
            </a>
          ))}
        </div>
      </section>

      <section id="optimizaciones" className="section">
        <h2>Optimizaciones</h2>
        <p>Guias para mejorar rendimiento, estabilidad, FPS y configuracion de dispositivos.</p>
      </section>

      <section id="descargas" className="section">
        <h2>Descargas legales</h2>
        <p>Archivos, plantillas, overlays y recursos seguros para jugadores y creadores.</p>
      </section>

      <section id="comunidad" className="section">
        <h2>Comunidad</h2>
        <p>Unete a la comunidad Danivex y comparte setups, configuraciones y resultados.</p>
        <a
          href="https://discord.gg/Ryg5usRZjv"
          className="discord-btn"
          target="_blank"
          rel="noreferrer"
        >
          Entrar al Discord
        </a>
      </section>

      <section id="contacto" className="section">
        <h2>Contacto</h2>
        <p>Proximamente: formulario, Discord y redes oficiales.</p>
      </section>
    </div>
  )
}

export default App

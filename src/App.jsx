import { useEffect, useMemo, useState } from 'react'
import logo from './assets/logo.png'
import fondo from './assets/fondo-gamer.png'
import { devices, tierLabels as fallbackTierLabels } from './data/devices'
import { calculateSensitivity } from './utils/sensitivity'
import './App.css'

const FREE_FIRE_RELEASE_DATE = new Date('2017-12-04T00:00:00')
const MAX_EXPERIENCE_YEARS = getMaxExperienceYears()
const defaultDevice = devices.find((device) => device.name === 'RedMagic 11 Pro') || devices[0]

const defaultProfile = {
  gameVersion: 'ff',
  rootState: defaultDevice.os === 'Android' ? 'no-root' : 'ios',
  style: 'balanced',
  years: Math.min(2, MAX_EXPERIENCE_YEARS),
  dpi: defaultDevice.defaultDpi,
  fireButton: 52,
  fpsTarget: 'auto',
}

const resultKeys = ['general', 'redDot', 'scope2x', 'scope4x', 'sniper', 'camera360']
const links = {
  discord: 'https://discord.gg/AmTUUANzRr',
  whatsapp: 'https://whatsapp.com/channel/0029Vb7ChEo2UPBIcPCSTI0m',
  instagram: 'https://www.instagram.com/dani.bpe/',
  tiktokMain: 'https://www.tiktok.com/@.mashesp',
  tiktokSecond: 'https://www.tiktok.com/@.danibpe',
}

const copy = {
  es: {
    lang: 'es',
    nav: ['Inicio', 'Sensibilidad', 'Optimizaciones', 'Descargas', 'Comunidad', 'Contacto'],
    heroText: 'Recursos gamer, optimizaciones legales, guias y herramientas para mejorar tu experiencia de juego.',
    primaryCta: 'Calcular sensibilidad',
    community: 'Comunidad',
    toolBadge: 'Herramienta principal',
    toolTitle: 'Sensibilidad FF',
    toolText: 'Elige tu dispositivo y deja que DaniVex arme una base lista para levantar mira con mas control.',
    step1: 'Paso 1',
    step2: 'Paso 2',
    result: 'Resultado',
    device: 'Dispositivo',
    profile: 'Perfil',
    models: 'modelos',
    searchModel: 'Buscar modelo',
    searchPlaceholder: 'Ej: iPhone 17, Galaxy A56, RedMagic 11 Pro',
    noModel: 'No encontre ese modelo. Prueba con marca o serie.',
    mobile: 'Movil',
    tablet: 'Tablet',
    defaultDpi: 'DPI base',
    version: 'Version',
    androidState: 'Estado Android',
    noRoot: 'No root',
    root: 'Root',
    style: 'Estilo',
    balanced: 'Balanceado',
    aggressive: 'Levantada agresiva',
    precise: 'Precision estable',
    years: 'Anos jugando',
    dpi: 'DPI del dispositivo',
    fireButton: 'Boton de disparo',
    fpsTarget: 'FPS objetivo',
    auto: 'Automatico',
    recommended: 'Sensibilidad recomendada',
    copy: 'Copiar',
    copied: 'Copiado',
    scale: 'Escala 0-200',
    coachStart: 'Lectura DaniVex:',
    coachEnd: 'Prueba 3 partidas, ajusta de 3 en 3 y guarda el mejor resultado.',
    optimizationsTitle: 'Optimizaciones',
    optimizationsText: 'Guias para mejorar rendimiento, estabilidad, FPS y configuracion de dispositivos.',
    downloadsTitle: 'Descargas legales',
    downloadsText: 'Archivos, plantillas, overlays y recursos seguros para jugadores y creadores.',
    communityText: 'Unete a la comunidad Danivex y comparte setups, configuraciones y resultados.',
    discord: 'Entrar al Discord',
    contactText: 'Conecta con DaniVex por Discord, WhatsApp y redes sociales oficiales.',
    discordServer: 'Servidor de Discord',
    whatsappChannel: 'Canal de WhatsApp',
    socialNetworks: 'Redes sociales',
    instagram: 'Instagram',
    tiktokMain: 'TikTok principal',
    tiktokSecond: 'Segundo TikTok',
    visitorCounter: 'Entradas registradas',
    visitorNote: 'contador local',
    resultLabels: {
      general: 'General',
      redDot: 'Mira de punto rojo',
      scope2x: 'Mira 2x',
      scope4x: 'Mira 4x',
      sniper: 'Mira Francotirador',
      camera360: 'Boton de Camara 360',
    },
    tiers: fallbackTierLabels,
    reasons: {
      device: (name, tier) => `${name} se trata como ${tier}.`,
      hz: (hz) => `${hz}Hz ajusta la base por respuesta tactil.`,
      old: 'El modelo se detecta como antiguo y baja sensibilidad para evitar saltos.',
      gaming: 'La categoria gaming permite valores mas agresivos.',
      root: 'Root suma margen por menor latencia configurable.',
      precise: 'El estilo preciso reduce la levantada para ganar control.',
      aggressive: 'El estilo agresivo sube la levantada.',
    },
  },
  pt: {
    lang: 'pt-BR',
    nav: ['Inicio', 'Sensibilidade', 'Otimizacoes', 'Downloads', 'Comunidade', 'Contato'],
    heroText: 'Recursos gamer, otimizacoes legais, guias e ferramentas para melhorar sua experiencia de jogo.',
    primaryCta: 'Calcular sensibilidade',
    community: 'Comunidade',
    toolBadge: 'Ferramenta principal',
    toolTitle: 'Sensibilidade FF',
    toolText: 'Escolha seu aparelho e deixe a DaniVex montar uma base pronta para subir capa com mais controle.',
    step1: 'Passo 1',
    step2: 'Passo 2',
    result: 'Resultado',
    device: 'Aparelho',
    profile: 'Perfil',
    models: 'modelos',
    searchModel: 'Buscar modelo',
    searchPlaceholder: 'Ex: iPhone 17, Galaxy A56, RedMagic 11 Pro',
    noModel: 'Nao encontrei esse modelo. Tente marca ou serie.',
    mobile: 'Celular',
    tablet: 'Tablet',
    defaultDpi: 'DPI base',
    version: 'Versao',
    androidState: 'Estado Android',
    noRoot: 'Sem root',
    root: 'Root',
    style: 'Estilo',
    balanced: 'Balanceado',
    aggressive: 'Puxada agressiva',
    precise: 'Precisao estavel',
    years: 'Anos jogando',
    dpi: 'DPI do aparelho',
    fireButton: 'Botao de tiro',
    fpsTarget: 'FPS alvo',
    auto: 'Automatico',
    recommended: 'Sensibilidade recomendada',
    copy: 'Copiar',
    copied: 'Copiado',
    scale: 'Escala 0-200',
    coachStart: 'Leitura DaniVex:',
    coachEnd: 'Teste 3 partidas, ajuste de 3 em 3 e salve o melhor resultado.',
    optimizationsTitle: 'Otimizacoes',
    optimizationsText: 'Guias para melhorar desempenho, estabilidade, FPS e configuracao de aparelhos.',
    downloadsTitle: 'Downloads legais',
    downloadsText: 'Arquivos, modelos, overlays e recursos seguros para jogadores e criadores.',
    communityText: 'Entre na comunidade DaniVex e compartilhe setups, configuracoes e resultados.',
    discord: 'Entrar no Discord',
    contactText: 'Conecte-se com DaniVex pelo Discord, WhatsApp e redes sociais oficiais.',
    discordServer: 'Servidor do Discord',
    whatsappChannel: 'Canal do WhatsApp',
    socialNetworks: 'Redes sociais',
    instagram: 'Instagram',
    tiktokMain: 'TikTok principal',
    tiktokSecond: 'Segundo TikTok',
    visitorCounter: 'Entradas registradas',
    visitorNote: 'contador local',
    resultLabels: {
      general: 'Geral',
      redDot: 'Mira ponto vermelho',
      scope2x: 'Mira 2x',
      scope4x: 'Mira 4x',
      sniper: 'Mira Sniper',
      camera360: 'Botao Camera 360',
    },
    tiers: {
      entry: 'Entrada',
      budget: 'Intermediario baixo',
      mid: 'Intermediario',
      upper: 'Intermediario alto',
      flagship: 'Top de linha',
      gaming: 'Gaming',
      tablet: 'Tablet',
      ipad: 'iPad',
    },
    reasons: {
      device: (name, tier) => `${name} entra como ${tier}.`,
      hz: (hz) => `${hz}Hz ajusta a base pela resposta ao toque.`,
      old: 'O modelo foi detectado como antigo e reduz sensibilidade para evitar pulos.',
      gaming: 'A categoria gaming permite valores mais agressivos.',
      root: 'Root soma margem por menor latencia configuravel.',
      precise: 'O estilo preciso reduz a puxada para ganhar controle.',
      aggressive: 'O estilo agressivo aumenta a puxada.',
    },
  },
  en: {
    lang: 'en',
    nav: ['Home', 'Sensitivity', 'Optimizations', 'Downloads', 'Community', 'Contact'],
    heroText: 'Gaming resources, safe optimizations, guides and tools to improve your play.',
    primaryCta: 'Calculate sensitivity',
    community: 'Community',
    toolBadge: 'Main tool',
    toolTitle: 'FF Sensitivity',
    toolText: 'Pick your device and let DaniVex build a ready base for cleaner drag and better control.',
    step1: 'Step 1',
    step2: 'Step 2',
    result: 'Result',
    device: 'Device',
    profile: 'Profile',
    models: 'models',
    searchModel: 'Search model',
    searchPlaceholder: 'Ex: iPhone 17, Galaxy A56, RedMagic 11 Pro',
    noModel: 'I could not find that model. Try a brand or series.',
    mobile: 'Phone',
    tablet: 'Tablet',
    defaultDpi: 'Base DPI',
    version: 'Version',
    androidState: 'Android state',
    noRoot: 'No root',
    root: 'Root',
    style: 'Style',
    balanced: 'Balanced',
    aggressive: 'Aggressive drag',
    precise: 'Stable precision',
    years: 'Years playing',
    dpi: 'Device DPI',
    fireButton: 'Fire button',
    fpsTarget: 'Target FPS',
    auto: 'Automatic',
    recommended: 'Recommended sensitivity',
    copy: 'Copy',
    copied: 'Copied',
    scale: '0-200 scale',
    coachStart: 'DaniVex read:',
    coachEnd: 'Try 3 matches, adjust by 3 and keep the best result.',
    optimizationsTitle: 'Optimizations',
    optimizationsText: 'Guides to improve performance, stability, FPS and device configuration.',
    downloadsTitle: 'Legal downloads',
    downloadsText: 'Files, templates, overlays and safe resources for players and creators.',
    communityText: 'Join the DaniVex community and share setups, configurations and results.',
    discord: 'Join Discord',
    contactText: 'Connect with DaniVex through Discord, WhatsApp and official socials.',
    discordServer: 'Discord server',
    whatsappChannel: 'WhatsApp channel',
    socialNetworks: 'Social networks',
    instagram: 'Instagram',
    tiktokMain: 'Main TikTok',
    tiktokSecond: 'Second TikTok',
    visitorCounter: 'Registered entries',
    visitorNote: 'local counter',
    resultLabels: {
      general: 'General',
      redDot: 'Red dot sight',
      scope2x: '2x scope',
      scope4x: '4x scope',
      sniper: 'Sniper scope',
      camera360: '360 Camera Button',
    },
    tiers: {
      entry: 'Entry',
      budget: 'Lower mid-range',
      mid: 'Mid-range',
      upper: 'Upper mid-range',
      flagship: 'Flagship',
      gaming: 'Gaming',
      tablet: 'Tablet',
      ipad: 'iPad',
    },
    reasons: {
      device: (name, tier) => `${name} is treated as ${tier}.`,
      hz: (hz) => `${hz}Hz adjusts the base through touch response.`,
      old: 'The model is detected as older and lowers sensitivity to avoid jumps.',
      gaming: 'Gaming class devices allow more aggressive values.',
      root: 'Root adds room through configurable lower latency.',
      precise: 'Precision style lowers drag for control.',
      aggressive: 'Aggressive style raises drag.',
    },
  },
}

function getMaxExperienceYears(now = new Date()) {
  let years = now.getFullYear() - FREE_FIRE_RELEASE_DATE.getFullYear()
  const beforeReleaseDay =
    now.getMonth() < FREE_FIRE_RELEASE_DATE.getMonth()
    || (now.getMonth() === FREE_FIRE_RELEASE_DATE.getMonth() && now.getDate() < FREE_FIRE_RELEASE_DATE.getDate())

  if (beforeReleaseDay) years -= 1
  return Math.min(8, Math.max(0, years))
}

function getPreferredLanguage() {
  const locale = (navigator.languages?.[0] || navigator.language || 'es').toLowerCase()
  if (locale.startsWith('pt') || locale.includes('-br')) return 'pt'
  if (locale.startsWith('en')) return 'en'
  return 'es'
}

function getLocalVisitCount() {
  const storageKey = 'danivex-visit-count'
  const sessionKey = 'danivex-visit-counted'

  try {
    const currentCount = Number(localStorage.getItem(storageKey) || '0')
    if (sessionStorage.getItem(sessionKey)) return Math.max(1, currentCount)

    const nextCount = currentCount + 1
    localStorage.setItem(storageKey, String(nextCount))
    sessionStorage.setItem(sessionKey, 'true')
    return nextCount
  } catch {
    return 1
  }
}

function App() {
  const [language] = useState(getPreferredLanguage)
  const [search, setSearch] = useState(defaultDevice.name)
  const [selectedDevice, setSelectedDevice] = useState(defaultDevice)
  const [profile, setProfile] = useState(defaultProfile)
  const [copied, setCopied] = useState(false)
  const [visitCount] = useState(getLocalVisitCount)
  const text = copy[language]
  const isApplePlatform = selectedDevice.os === 'iOS' || selectedDevice.os === 'iPadOS'
  const experienceOptions = Array.from({ length: MAX_EXPERIENCE_YEARS + 1 }, (_, year) => year)

  useEffect(() => {
    document.documentElement.lang = text.lang
  }, [text.lang])

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase()
    const defaultNames = ['RedMagic 11 Pro', 'Galaxy A56 5G', 'Galaxy S26 Ultra', 'iPhone 17 Pro Max', 'Xiaomi Pad 7']
    const pool = query
      ? devices.filter((device) => device.search.includes(query))
      : devices.filter((device) => defaultNames.includes(device.name))

    return pool.slice(0, 14)
  }, [search])

  const result = useMemo(
    () => calculateSensitivity(selectedDevice, profile, text),
    [selectedDevice, profile, text],
  )

  function updateProfile(key, value) {
    setProfile((current) => {
      let parsedValue = value
      if (key === 'years') parsedValue = Math.min(MAX_EXPERIENCE_YEARS, Math.max(0, Number(value || 0)))
      if (key === 'dpi') parsedValue = Math.min(1200, Math.max(0, Number(value || 0)))
      if (key === 'fireButton') parsedValue = Math.min(200, Math.max(0, Number(value || 0)))

      return {
        ...current,
        [key]: parsedValue,
      }
    })
  }

  function selectDevice(device) {
    setSelectedDevice(device)
    setSearch(device.name)
    setProfile((current) => ({
      ...current,
      dpi: device.defaultDpi,
      rootState: device.os === 'Android' ? (current.rootState === 'ios' ? 'no-root' : current.rootState) : 'ios',
    }))
  }

  async function copyPreset() {
    const values = result.values
    const lines = [
      `DaniVex - ${selectedDevice.name}`,
      `${text.resultLabels.general}: ${values.general}`,
      `${text.resultLabels.redDot}: ${values.redDot}`,
      `${text.resultLabels.scope2x}: ${values.scope2x}`,
      `${text.resultLabels.scope4x}: ${values.scope4x}`,
      `${text.resultLabels.sniper}: ${values.sniper}`,
      `${text.resultLabels.camera360}: ${values.camera360}`,
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
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
          <a href="#inicio">{text.nav[0]}</a>
          <a href="#sensibilidad">{text.nav[1]}</a>
          <a href="#optimizaciones">{text.nav[2]}</a>
          <a href="#descargas">{text.nav[3]}</a>
          <a href="#comunidad">{text.nav[4]}</a>
          <a href="#contacto">{text.nav[5]}</a>
        </div>
      </nav>

      <section id="inicio" className="hero">
        <div className="hero-card">
          <img src={logo} alt="Danivex Logo" className="hero-logo" />
          <h1>DANIVEX</h1>
          <p>{text.heroText}</p>

          <div className="buttons">
            <a href="#sensibilidad" className="btn primary">{text.primaryCta}</a>
            <a href="#comunidad" className="btn secondary">{text.community}</a>
          </div>

          <div className="visitor-counter" aria-live="polite">
            <span>{text.visitorCounter}</span>
            <strong>{visitCount}</strong>
            <small>{text.visitorNote}</small>
          </div>
        </div>
      </section>

      <section id="sensibilidad" className="tool-section">
        <div className="section-heading">
          <span>{text.toolBadge}</span>
          <h2>{text.toolTitle}</h2>
          <p>{text.toolText}</p>
        </div>

        <div className="senselab">
          <div className="tool-panel device-panel">
            <div className="panel-head">
              <div>
                <span>{text.step1}</span>
                <h3>{text.device}</h3>
              </div>
              <strong>{devices.length} {text.models}</strong>
            </div>

            <label className="field full">
              <span>{text.searchModel}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.searchPlaceholder}
              />
            </label>

            <div className="suggestions" role="listbox" aria-label={text.searchModel}>
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
                        {device.brand} - {device.os} - {device.type === 'tablet' ? text.tablet : text.mobile} - {device.hz}Hz
                      </small>
                    </span>
                    <em>{text.tiers[device.tier]}</em>
                  </button>
                ))
              ) : (
                <div className="empty-state">{text.noModel}</div>
              )}
            </div>

            <div className="selected-device">
              <h4>{selectedDevice.name}</h4>
              <div>
                <span>{selectedDevice.brand}</span>
                <span>{selectedDevice.os}</span>
                <span>{selectedDevice.type === 'tablet' ? text.tablet : text.mobile}</span>
                <span>{selectedDevice.hz}Hz</span>
                <span>{selectedDevice.screen}"</span>
                <span>{text.defaultDpi}: {selectedDevice.defaultDpi}</span>
                <span>{text.tiers[selectedDevice.tier]}</span>
              </div>
            </div>
          </div>

          <div className="tool-panel profile-panel">
            <div className="panel-head">
              <div>
                <span>{text.step2}</span>
                <h3>{text.profile}</h3>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>{text.version}</span>
                <select value={profile.gameVersion} onChange={(event) => updateProfile('gameVersion', event.target.value)}>
                  <option value="ff">Free Fire</option>
                  <option value="ffmax">Free Fire MAX</option>
                </select>
              </label>

              {!isApplePlatform && (
                <label className="field">
                  <span>{text.androidState}</span>
                  <select value={profile.rootState} onChange={(event) => updateProfile('rootState', event.target.value)}>
                    <option value="no-root">{text.noRoot}</option>
                    <option value="root">{text.root}</option>
                  </select>
                </label>
              )}

              <label className="field">
                <span>{text.style}</span>
                <select value={profile.style} onChange={(event) => updateProfile('style', event.target.value)}>
                  <option value="balanced">{text.balanced}</option>
                  <option value="aggressive">{text.aggressive}</option>
                  <option value="precise">{text.precise}</option>
                </select>
              </label>

              <label className="field">
                <span>{text.years}</span>
                <select value={profile.years} onChange={(event) => updateProfile('years', event.target.value)}>
                  {experienceOptions.map((year) => (
                    <option value={year} key={year}>{year}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{text.dpi}</span>
                <input type="number" min="0" max="1200" value={profile.dpi} onChange={(event) => updateProfile('dpi', event.target.value)} />
              </label>

              <label className="field">
                <span>{text.fireButton}</span>
                <input type="number" min="0" max="200" value={profile.fireButton} onChange={(event) => updateProfile('fireButton', event.target.value)} />
              </label>

              <label className="field">
                <span>{text.fpsTarget}</span>
                <select value={profile.fpsTarget} onChange={(event) => updateProfile('fpsTarget', event.target.value)}>
                  <option value="auto">{text.auto}</option>
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
                <span>{text.result}</span>
                <h3>{text.recommended}</h3>
              </div>
              <button type="button" className="copy-btn" onClick={copyPreset}>
                {copied ? text.copied : text.copy}
              </button>
            </div>

            <div className="result-grid">
              {resultKeys.map((key) => (
                <div className="result-card" key={key}>
                  <span>{text.resultLabels[key]}</span>
                  <strong>{result.values[key]}</strong>
                  <small>{text.scale}</small>
                </div>
              ))}
            </div>

            <div className="bars" aria-label={text.recommended}>
              {resultKeys.map((key) => (
                <div className="bar-row" key={key}>
                  <span>{text.resultLabels[key]}</span>
                  <div><i style={{ width: `${result.values[key] / 2}%` }} /></div>
                  <b>{result.values[key]}</b>
                </div>
              ))}
            </div>

            <p className="coach">
              <strong>{text.coachStart}</strong> {result.reasons.join(' ')}
              {' '}{text.coachEnd}
            </p>
          </div>
        </div>
      </section>

      <section id="optimizaciones" className="section">
        <h2>{text.optimizationsTitle}</h2>
        <p>{text.optimizationsText}</p>
      </section>

      <section id="descargas" className="section">
        <h2>{text.downloadsTitle}</h2>
        <p>{text.downloadsText}</p>
      </section>

      <section id="comunidad" className="section">
        <h2>{text.nav[4]}</h2>
        <p>{text.communityText}</p>
        <a
          href={links.discord}
          className="discord-btn"
          target="_blank"
          rel="noreferrer"
        >
          {text.discord}
        </a>
      </section>

      <section id="contacto" className="section">
        <h2>{text.nav[5]}</h2>
        <p>{text.contactText}</p>
        <div className="contact-grid">
          <a className="contact-card discord-card" href={links.discord} target="_blank" rel="noreferrer">
            <span>{text.discordServer}</span>
            <strong>Discord</strong>
          </a>
          <a className="contact-card whatsapp-card" href={links.whatsapp} target="_blank" rel="noreferrer">
            <span>{text.whatsappChannel}</span>
            <strong>WhatsApp</strong>
          </a>
        </div>

        <div className="social-block">
          <h3>{text.socialNetworks}</h3>
          <div className="social-links">
            <a href={links.instagram} target="_blank" rel="noreferrer">{text.instagram}</a>
            <a href={links.tiktokMain} target="_blank" rel="noreferrer">{text.tiktokMain}</a>
            <a href={links.tiktokSecond} target="_blank" rel="noreferrer">{text.tiktokSecond}</a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App

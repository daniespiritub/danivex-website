import { useEffect, useMemo, useState } from 'react'
import { FaDiscord, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import { PiChartBarBold, PiDeviceMobileBold, PiEyeBold, PiSlidersHorizontalBold } from 'react-icons/pi'
import logo from './assets/logo.png'
import fondo from './assets/fondo-gamer.png'
import mobiladorLogo from './assets/mobilador-logo.png'
import {
  createManualDevice,
  devices,
  filterDevicesByPlatform,
  getDevicePlatform,
  getManualTierOptions,
  loadMassiveDeviceCatalog,
  tierLabels as fallbackTierLabels,
} from './data/devices'
import { calculateSensitivity } from './utils/sensitivity'
import FreeFirePrimeScanner from './pages/FreeFirePrimeScanner'
import './App.css'

const FREE_FIRE_RELEASE_DATE = new Date('2017-12-04T00:00:00')
const MAX_EXPERIENCE_YEARS = getMaxExperienceYears()
const defaultDevice = devices.find((device) => device.name === 'RedMagic 11 Pro') || devices[0]

const defaultProfile = {
  gameVersion: 'ff',
  rootState: defaultDevice.os === 'Android' ? 'no-root' : 'ios',
  rankMode: 'de-ranked',
  years: Math.min(2, MAX_EXPERIENCE_YEARS),
  dpi: defaultDevice.defaultDpi,
  fireButton: 52,
  fpsTarget: 'auto',
}

const platformDefaults = {
  android: 'RedMagic 11 Pro',
  ios: 'iPhone 17 Pro Max',
  tablet: 'Xiaomi Pad 7',
}

const platformFallbackManualTier = {
  android: 'mid',
  ios: 'iphone',
  tablet: 'tablet-android',
}

const resultKeys = ['general', 'redDot', 'scope2x', 'scope4x', 'sniper', 'camera360']
const links = {
  discord: 'https://discord.gg/AmTUUANzRr',
  whatsapp: 'https://whatsapp.com/channel/0029Vb7ChEo2UPBIcPCSTI0m',
  instagram: 'https://www.instagram.com/dani.bpe/',
  tiktokMain: 'https://www.tiktok.com/@.mashesp',
  tiktokSecond: 'https://www.tiktok.com/@.danibpe',
  mobiladorDownload: 'https://github.com/daniespiritub/danivex-mobilador/releases/download/v0.0.0.1/DaniVex-Mobilador-Setup.exe',
}

const copy = {
  es: {
    lang: 'es',
    nav: ['Inicio', 'Sensibilidad', 'Optimizaciones', 'Descargas', 'Comunidad', 'Contacto'],
    heroText: 'Recursos gamer, optimizaciones legales, guías y herramientas para mejorar tu experiencia de juego.',
    primaryCta: 'Calcular sensibilidad',
    community: 'Comunidad',
    primeScanner: 'Prime Scanner',
    toolBadge: 'Herramienta principal',
    toolTitle: 'Sensibilidad FF',
    toolText: 'Elige tu dispositivo y deja que DaniVex arme una base lista para levantar mira con más control.',
    step1: 'Paso 1',
    step2: 'Paso 2',
    result: 'Resultado',
    device: 'Dispositivo',
    profile: 'Perfil',
    models: 'modelos',
    searchModel: 'Buscar modelo',
    deviceType: 'Tipo de dispositivo',
    android: 'Android',
    ios: 'iOS',
    searchPlaceholder: 'Ej: iPhone 17, Galaxy A56, RedMagic 11 Pro',
    noModel: 'No encontré ese modelo. Prueba con marca o serie.',
    manualDevice: 'No encuentro mi dispositivo',
    manualTier: 'Elegir gama manualmente',
    loadingDevices: 'Cargando catálogo...',
    mobile: 'Móvil',
    tablet: 'Tablet',
    defaultDpi: 'DPI base',
    version: 'Versión',
    androidState: 'Estado Android',
    noRoot: 'No root',
    root: 'Root',
    rankMode: 'Clasificatoria',
    deRanked: 'DE Clasificatoria',
    brRanked: 'BR Clasificatoria',
    years: 'AÑOS JUGANDO',
    dpi: 'DPI del dispositivo',
    fireButton: 'Botón de disparo',
    fpsTarget: 'FPS objetivo',
    auto: 'Automático',
    recommended: 'Sensibilidad recomendada',
    copy: 'Copiar',
    copied: 'Copiado',
    coachStart: 'Lectura DaniVex:',
    coachEnd: 'Prueba 3 partidas, ajusta de 3 en 3 y guarda el mejor resultado.',
    optimizationsTitle: 'Optimizaciones',
    optimizationsText: 'Guías para mejorar rendimiento, estabilidad, FPS y configuración de dispositivos.',
    downloadsTitle: 'Descargas legales',
    downloadsText: 'Archivos, plantillas, overlays y recursos seguros para jugadores y creadores.',
    mobiladorTitle: 'DaniVex Mobilador',
    mobiladorText: 'Controla y refleja tu Android en PC con baja latencia: modos de rendimiento, HUD en tiempo real y perfiles listos para jugar.',
    mobiladorButton: 'Descargar DaniVex Mobilador',
    mobiladorNote: 'Windows 7, 8, 8.1, 10 y 11 · 64 bits',
    communityText: 'Únete a la comunidad Danivex y comparte setups, configuraciones y resultados.',
    discord: 'Entrar al Discord',
    whatsapp: 'Comunidad DaniVex',
    contactText: 'Conecta con DaniVex por Discord y redes sociales oficiales.',
    discordServer: 'Discord',
    socialNetworks: 'Redes sociales',
    instagram: 'Instagram',
    tiktokMain: 'TikTok / Gaming',
    tiktokSecond: 'TikTok Personal',
    visits: 'Visitas',
    resultLabels: {
      general: 'General',
      redDot: 'Mira de punto rojo',
      scope2x: 'Mira 2x',
      scope4x: 'Mira 4x',
      sniper: 'Mira Francotirador',
      camera360: 'Botón de Cámara 360',
    },
    tiers: fallbackTierLabels,
    reasons: {
      device: (name, tier) => `${name} se trata como ${tier}.`,
      hz: (hz) => `${hz}Hz ajusta la base por respuesta táctil.`,
      old: 'El modelo se detecta como antiguo y baja sensibilidad para evitar saltos.',
      gaming: 'La categoría gaming permite valores más agresivos.',
      root: 'Root suma margen por menor latencia configurable.',
      deRank: 'DE Clasificatoria prioriza reacción rápida para duelos 4 vs 4 en mapa pequeño.',
      brRank: 'BR Clasificatoria prioriza control estable para mapa grande y combates largos.',
    },
  },
  pt: {
    lang: 'pt-BR',
    nav: ['Inicio', 'Sensibilidade', 'Otimizacoes', 'Downloads', 'Comunidade', 'Contato'],
    heroText: 'Recursos gamer, otimizacoes legais, guias e ferramentas para melhorar sua experiencia de jogo.',
    primaryCta: 'Calcular sensibilidade',
    community: 'Comunidade',
    primeScanner: 'Prime Scanner',
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
    manualDevice: 'Nao encontro meu aparelho',
    manualTier: 'Escolher categoria manualmente',
    mobile: 'Celular',
    tablet: 'Tablet',
    defaultDpi: 'DPI base',
    version: 'Versao',
    androidState: 'Estado Android',
    noRoot: 'Sem root',
    root: 'Root',
    deviceType: 'Tipo de aparelho',
    android: 'Android',
    ios: 'iOS',
    loadingDevices: 'Carregando catalogo...',
    rankMode: 'Classificatoria',
    deRanked: 'DE Classificatoria',
    brRanked: 'BR Classificatoria',
    years: 'Anos jogando',
    dpi: 'DPI do aparelho',
    fireButton: 'Botao de tiro',
    fpsTarget: 'FPS alvo',
    auto: 'Automatico',
    recommended: 'Sensibilidade recomendada',
    copy: 'Copiar',
    copied: 'Copiado',
    coachStart: 'Leitura DaniVex:',
    coachEnd: 'Teste 3 partidas, ajuste de 3 em 3 e salve o melhor resultado.',
    optimizationsTitle: 'Otimizacoes',
    optimizationsText: 'Guias para melhorar desempenho, estabilidade, FPS e configuracao de aparelhos.',
    downloadsTitle: 'Downloads legais',
    downloadsText: 'Arquivos, modelos, overlays e recursos seguros para jogadores e criadores.',
    mobiladorTitle: 'DaniVex Mobilador',
    mobiladorText: 'Controle e espelhe seu Android no PC com baixa latencia: modos de desempenho, HUD em tempo real e perfis prontos para jogar.',
    mobiladorButton: 'Baixar DaniVex Mobilador',
    mobiladorNote: 'Windows 7, 8, 8.1, 10 e 11 - 64 bits',
    communityText: 'Entre na comunidade DaniVex e compartilhe setups, configuracoes e resultados.',
    discord: 'Entrar no Discord',
    whatsapp: 'Comunidade DaniVex',
    contactText: 'Conecte-se com DaniVex pelo Discord e redes sociais oficiais.',
    discordServer: 'Discord',
    socialNetworks: 'Redes sociais',
    instagram: 'Instagram',
    tiktokMain: 'TikTok / Gaming',
    tiktokSecond: 'TikTok Pessoal',
    visits: 'Visitas',
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
      deRank: 'DE Classificatoria prioriza reacao rapida para duelos 4 vs 4 em mapa pequeno.',
      brRank: 'BR Classificatoria prioriza controle estavel para mapa grande e combates longos.',
    },
  },
  en: {
    lang: 'en',
    nav: ['Home', 'Sensitivity', 'Optimizations', 'Downloads', 'Community', 'Contact'],
    heroText: 'Gaming resources, safe optimizations, guides and tools to improve your play.',
    primaryCta: 'Calculate sensitivity',
    community: 'Community',
    primeScanner: 'Prime Scanner',
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
    manualDevice: 'I cannot find my device',
    manualTier: 'Choose tier manually',
    mobile: 'Phone',
    tablet: 'Tablet',
    defaultDpi: 'Base DPI',
    version: 'Version',
    androidState: 'Android state',
    noRoot: 'No root',
    root: 'Root',
    deviceType: 'Device type',
    android: 'Android',
    ios: 'iOS',
    loadingDevices: 'Loading catalog...',
    rankMode: 'Ranked mode',
    deRanked: 'CS Ranked',
    brRanked: 'BR Ranked',
    years: 'Years playing',
    dpi: 'Device DPI',
    fireButton: 'Fire button',
    fpsTarget: 'Target FPS',
    auto: 'Automatic',
    recommended: 'Recommended sensitivity',
    copy: 'Copy',
    copied: 'Copied',
    coachStart: 'DaniVex read:',
    coachEnd: 'Try 3 matches, adjust by 3 and keep the best result.',
    optimizationsTitle: 'Optimizations',
    optimizationsText: 'Guides to improve performance, stability, FPS and device configuration.',
    downloadsTitle: 'Legal downloads',
    downloadsText: 'Files, templates, overlays and safe resources for players and creators.',
    mobiladorTitle: 'DaniVex Mobilador',
    mobiladorText: 'Control and mirror your Android on PC with low latency: performance modes, real-time HUD and ready-to-play profiles.',
    mobiladorButton: 'Download DaniVex Mobilador',
    mobiladorNote: 'Windows 7, 8, 8.1, 10 and 11 - 64-bit',
    communityText: 'Join the DaniVex community and share setups, configurations and results.',
    discord: 'Join Discord',
    whatsapp: 'DaniVex Community',
    contactText: 'Connect with DaniVex through Discord and official socials.',
    discordServer: 'Discord',
    socialNetworks: 'Social networks',
    instagram: 'Instagram',
    tiktokMain: 'TikTok / Gaming',
    tiktokSecond: 'Personal TikTok',
    visits: 'Visits',
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
      deRank: 'CS Ranked favors fast response for 4v4 fights on small maps.',
      brRank: 'BR Ranked favors steadier control for large maps and longer fights.',
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

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function setCookie(name, value, maxAgeSeconds) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`
}

function stableNumberSeed(text) {
  return [...text].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261)
}

function getLocalVisitCount() {
  const stateKey = 'danivex-counter-state'
  const realVisitKey = 'danivex-real-visit'
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const secondsToday = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds()
  const secondsPerDay = 86400
  const dailyTarget = 32 + (stableNumberSeed(`${todayKey}:danivex`) % 11)
  const bucket = Math.floor(secondsToday / 1800)
  const controlledNoise = (stableNumberSeed(`${todayKey}:${bucket}:views`) % 3) - 1

  try {
    const storedState = JSON.parse(getCookie(stateKey) || '{}')
    const legacyCount = Number(localStorage.getItem('danivex-visit-count') || '0')
    const hasRealVisit = Boolean(getCookie(realVisitKey))
    const baseCount = Math.max(1, Number(storedState.base || 0), legacyCount)
    let state = {
      day: storedState.day || todayKey,
      base: baseCount,
      realVisits: Number(storedState.realVisits || 0),
      lastValue: Math.max(baseCount, Number(storedState.lastValue || 0)),
    }

    if (state.day !== todayKey) {
      const previousTarget = 32 + (stableNumberSeed(`${state.day}:danivex`) % 11)
      state = {
        day: todayKey,
        base: Math.max(state.lastValue, state.base + previousTarget + state.realVisits),
        realVisits: 0,
        lastValue: Math.max(state.lastValue, state.base + previousTarget + state.realVisits),
      }
    }

    if (!hasRealVisit) {
      state.realVisits += 1
      setCookie(realVisitKey, '1', 60 * 30)
    }

    const organicProgress = Math.max(0, Math.min(dailyTarget, Math.floor((dailyTarget * secondsToday) / secondsPerDay) + controlledNoise))
    const nextCount = Math.max(state.lastValue, state.base + organicProgress + state.realVisits)
    const nextState = {
      ...state,
      lastValue: nextCount,
    }

    setCookie(stateKey, JSON.stringify(nextState), 60 * 60 * 24 * 400)
    return nextCount
  } catch {
    return 1
  }
}

function HomePage() {
  const [language] = useState(getPreferredLanguage)
  const [devicePlatform, setDevicePlatform] = useState('android')
  const [catalogDevices, setCatalogDevices] = useState(devices)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [search, setSearch] = useState(defaultDevice.name)
  const [selectedDevice, setSelectedDevice] = useState(defaultDevice)
  const [manualTier, setManualTier] = useState('mid')
  const [profile, setProfile] = useState(defaultProfile)
  const [copied, setCopied] = useState(false)
  const [visitCount, setVisitCount] = useState(getLocalVisitCount)
  const [activeSection, setActiveSection] = useState('inicio')
  const text = copy[language]
  const isApplePlatform = selectedDevice.os === 'iOS' || selectedDevice.os === 'iPadOS'
  const showAndroidTuning = !isApplePlatform
  const experienceOptions = Array.from({ length: MAX_EXPERIENCE_YEARS + 1 }, (_, year) => year)
  const platformOptions = [
    { value: 'android', label: text.android },
    { value: 'ios', label: text.ios },
    { value: 'tablet', label: text.tablet },
  ]

  useEffect(() => {
    document.documentElement.lang = text.lang
  }, [text.lang])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('section[id]'))
    if (!sections.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVisitCount(getLocalVisitCount())
    }, 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const platformDevices = useMemo(
    () => filterDevicesByPlatform(catalogDevices, devicePlatform),
    [catalogDevices, devicePlatform],
  )

  const manualOptions = useMemo(
    () => getManualTierOptions(devicePlatform),
    [devicePlatform],
  )

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase()
    const defaultNames = {
      android: ['RedMagic 11 Pro', 'Galaxy A56 5G', 'Galaxy S26 Ultra'],
      ios: ['iPhone 17 Pro Max', 'iPhone 16 Pro Max', 'iPhone 15 Pro Max'],
      tablet: ['Xiaomi Pad 7', 'iPad Pro 11 M4', 'RedMagic Nova Tablet'],
    }
    const pool = query
      ? platformDevices.filter((device) => device.search.includes(query))
      : platformDevices.filter((device) => defaultNames[devicePlatform].includes(device.name))

    return pool.slice(0, 14)
  }, [devicePlatform, platformDevices, search])

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

  async function ensureMassiveCatalog(platform = devicePlatform) {
    if (platform === 'ios' || catalogDevices.length > devices.length || isCatalogLoading) return

    setIsCatalogLoading(true)
    try {
      const loadedDevices = await loadMassiveDeviceCatalog()
      setCatalogDevices(loadedDevices)
    } finally {
      setIsCatalogLoading(false)
    }
  }

  function updateSelectedDevice(nextDevice) {
    setSelectedDevice(nextDevice)
    setSearch(nextDevice.isManual ? '' : nextDevice.name)
    setProfile((current) => ({
      ...current,
      dpi: nextDevice.defaultDpi,
      rootState: nextDevice.os === 'Android' ? (current.rootState === 'ios' ? 'no-root' : current.rootState) : 'ios',
    }))
  }

  function selectDevicePlatform(platform) {
    const defaultName = platformDefaults[platform]
    const nextDevices = filterDevicesByPlatform(catalogDevices, platform)
    const nextDevice = nextDevices.find((device) => device.name === defaultName) || nextDevices[0] || createManualDevice(platformFallbackManualTier[platform], platform)
    const nextManualTier = platformFallbackManualTier[platform]

    setDevicePlatform(platform)
    setManualTier(nextManualTier)
    updateSelectedDevice(nextDevice)
  }

  function selectDevice(device) {
    setDevicePlatform(getDevicePlatform(device))
    updateSelectedDevice(device)
  }

  function selectManualDevice(value = manualTier) {
    const manualDevice = createManualDevice(value, devicePlatform)
    setManualTier(manualDevice.manualTierValue)
    updateSelectedDevice(manualDevice)
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
          <a href="#inicio" className={activeSection === 'inicio' ? 'active' : ''}>{text.nav[0]}</a>
          <a href="#sensibilidad" className={activeSection === 'sensibilidad' ? 'active' : ''}>{text.nav[1]}</a>
          <a href="/free-fire-prime-scanner">{text.primeScanner}</a>
          <a href="#optimizaciones" className={activeSection === 'optimizaciones' ? 'active' : ''}>{text.nav[2]}</a>
          <a href="#descargas" className={activeSection === 'descargas' ? 'active' : ''}>{text.nav[3]}</a>
          <a href="#comunidad" className={activeSection === 'comunidad' ? 'active' : ''}>{text.nav[4]}</a>
          <a href="#contacto" className={activeSection === 'contacto' ? 'active' : ''}>{text.nav[5]}</a>
        </div>
      </nav>

      <div className="visitor-counter" aria-label={String(visitCount)}>
        <PiEyeBold aria-hidden="true" />
        <strong>{visitCount}</strong>
      </div>

      <section id="inicio" className="hero">
        <div className="hero-card">
          <img src={logo} alt="Danivex Logo" className="hero-logo" />
          <h1>DANIVEX</h1>
          <p>{text.heroText}</p>

          <div className="buttons">
            <a href="#sensibilidad" className="btn primary">{text.primaryCta}</a>
            <a href="/free-fire-prime-scanner" className="btn secondary">{text.primeScanner}</a>
            <a href="#comunidad" className="btn secondary">{text.community}</a>
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
              <div className="panel-head-title">
                <span className="step-badge"><PiDeviceMobileBold aria-hidden="true" /></span>
                <h3>{text.device}</h3>
              </div>
              <strong>{platformDevices.length} {text.models}</strong>
            </div>

            <div className="device-type-tabs" aria-label={text.deviceType}>
              {platformOptions.map((option) => (
                <button
                  aria-pressed={devicePlatform === option.value}
                  className={devicePlatform === option.value ? 'active' : ''}
                  key={option.value}
                  type="button"
                  onClick={() => selectDevicePlatform(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="field full">
              <span>{text.searchModel}</span>
              <input
                type="search"
                value={search}
                onFocus={() => ensureMassiveCatalog(devicePlatform)}
                onChange={(event) => {
                  setSearch(event.target.value)
                  ensureMassiveCatalog(devicePlatform)
                }}
                placeholder={text.searchPlaceholder}
              />
            </label>

            <div className="suggestions" role="listbox" aria-label={text.searchModel}>
              {isCatalogLoading && (
                <div className="empty-state">{text.loadingDevices}</div>
              )}

              {filteredDevices.length > 0 ? (
                filteredDevices.map((device) => (
                  <button
                    className={`suggestion ${selectedDevice.brand === device.brand && selectedDevice.name === device.name ? 'active' : ''}`}
                    key={`${device.brand}-${device.name}-${device.os}-${device.type}`}
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
              ) : !isCatalogLoading && (
                <div className="empty-state">{text.noModel}</div>
              )}

              <button
                className={`suggestion manual-suggestion ${selectedDevice.isManual ? 'active' : ''}`}
                type="button"
                onClick={() => selectManualDevice()}
              >
                <span>
                  <strong>{text.manualDevice}</strong>
                  <small>{text.manualTier}</small>
                </span>
                <em>Manual</em>
              </button>
            </div>

            {selectedDevice.isManual && (
              <div className="manual-device">
                <span>{text.manualTier}</span>
                <div>
                  {manualOptions.map((option) => (
                    <button
                      className={manualTier === option.value ? 'active' : ''}
                      key={option.value}
                      type="button"
                      onClick={() => selectManualDevice(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="selected-device">
              <h4>{selectedDevice.name}</h4>
              <div>
                <span>{selectedDevice.brand}</span>
                <span>{selectedDevice.os}</span>
                <span>{selectedDevice.type === 'tablet' ? text.tablet : text.mobile}</span>
                {showAndroidTuning && <span>{selectedDevice.hz}Hz</span>}
                <span>{selectedDevice.screen}"</span>
                {showAndroidTuning && <span>{text.defaultDpi}: {selectedDevice.defaultDpi}</span>}
                <span>{text.tiers[selectedDevice.tier]}</span>
              </div>
            </div>
          </div>

          <div className="tool-panel profile-panel">
            <div className="panel-head">
              <div className="panel-head-title">
                <span className="step-badge"><PiSlidersHorizontalBold aria-hidden="true" /></span>
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

              {showAndroidTuning && (
                <label className="field">
                  <span>{text.androidState}</span>
                  <select value={profile.rootState} onChange={(event) => updateProfile('rootState', event.target.value)}>
                    <option value="no-root">{text.noRoot}</option>
                    <option value="root">{text.root}</option>
                  </select>
                </label>
              )}

              <label className="field">
                <span>{text.rankMode}</span>
                <select value={profile.rankMode} onChange={(event) => updateProfile('rankMode', event.target.value)}>
                  <option value="de-ranked">{text.deRanked}</option>
                  <option value="br-ranked">{text.brRanked}</option>
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

              {showAndroidTuning && (
                <label className="field">
                  <span>{text.dpi}</span>
                  <input type="number" min="0" max="1200" value={profile.dpi} onChange={(event) => updateProfile('dpi', event.target.value)} />
                </label>
              )}

              <label className="field">
                <span>{text.fireButton}</span>
                <input type="number" min="0" max="200" value={profile.fireButton} onChange={(event) => updateProfile('fireButton', event.target.value)} />
              </label>

              {showAndroidTuning && (
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
              )}
            </div>
          </div>

          <div className="tool-panel result-panel">
            <div className="panel-head">
              <div className="panel-head-title">
                <span className="step-badge"><PiChartBarBold aria-hidden="true" /></span>
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

      <section id="descargas" className="section section-wide">
        <h2>{text.downloadsTitle}</h2>
        <p>{text.downloadsText}</p>

        <div className="download-card">
          <div className="download-media">
            <img src={mobiladorLogo} alt="DaniVex Mobilador" loading="lazy" />
          </div>
          <div className="download-info">
            <h3>{text.mobiladorTitle}</h3>
            <p>{text.mobiladorText}</p>
            <a className="btn primary download-btn" href={links.mobiladorDownload} download>
              {text.mobiladorButton}
            </a>
            <span className="download-note">{text.mobiladorNote}</span>
          </div>
        </div>
      </section>

      <section id="comunidad" className="section">
        <h2>{text.nav[4]}</h2>
        <p>{text.communityText}</p>
        <div className="social-actions">
          <a className="social-button discord" href={links.discord} target="_blank" rel="noreferrer">
            <FaDiscord aria-hidden="true" />
            <span>{text.discordServer}</span>
          </a>
          <a className="social-button whatsapp" href={links.whatsapp} target="_blank" rel="noreferrer">
            <FaWhatsapp aria-hidden="true" />
            <span>{text.whatsapp}</span>
          </a>
        </div>
      </section>

      <section id="contacto" className="section">
        <h2>{text.nav[5]}</h2>
        <p>{text.contactText}</p>
        <div className="social-actions contact-actions">
          <a className="social-button instagram" href={links.instagram} target="_blank" rel="noreferrer">
            <FaInstagram aria-hidden="true" />
            <span>{text.instagram}</span>
          </a>
          <a className="social-button tiktok" href={links.tiktokMain} target="_blank" rel="noreferrer">
            <FaTiktok aria-hidden="true" />
            <span>{text.tiktokMain}</span>
          </a>
          <a className="social-button tiktok" href={links.tiktokSecond} target="_blank" rel="noreferrer">
            <FaTiktok aria-hidden="true" />
            <span>{text.tiktokSecond}</span>
          </a>
        </div>
      </section>
    </div>
  )
}

function App() {
  const normalizedPath = window.location.pathname.replace(/\/$/, '')
  const isPrimeScanner = normalizedPath === '/free-fire-prime-scanner'
  const isAccountProfile = /^\/cuenta\/\d+\.html$/.test(normalizedPath)

  if (isPrimeScanner || isAccountProfile) return <FreeFirePrimeScanner />

  return <HomePage />
}

export default App

import { useEffect, useMemo, useState } from 'react'
import { FaDiscord, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import { PiChartBarBold, PiDeviceMobileBold, PiEyeBold, PiSlidersHorizontalBold } from 'react-icons/pi'
import logo from '../assets/logo.webp'
import fondo from '../assets/fondo-gamer.webp'
import mobiladorLogo from '../assets/mobilador-logo.webp'
import mobiladorScreenInicio from '../assets/mobilador-screens/inicio.png'
import mobiladorScreenPerfiles from '../assets/mobilador-screens/perfiles.png'
import mobiladorScreenAcercaDe from '../assets/mobilador-screens/acerca-de.png'
import {
  createManualDevice,
  devices,
  filterDevicesByPlatform,
  getDevicePlatform,
  getManualTierOptions,
  loadMassiveDeviceCatalog,
} from '../data/devices'
import { calculateSensitivity } from '../utils/sensitivity'
import { copy } from '../data/copy.js'

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

async function fetchVisitCount(method) {
  try {
    const response = await fetch('/api/visits', { method })
    if (!response.ok) return null

    const data = await response.json()
    return data.ok ? Number(data.count) : null
  } catch {
    return null
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
  const [visitCount, setVisitCount] = useState(null)
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
    let cancelled = false
    const sessionKey = 'danivex-visit-session'
    const hasSession = Boolean(sessionStorage.getItem(sessionKey))
    if (!hasSession) sessionStorage.setItem(sessionKey, '1')

    fetchVisitCount(hasSession ? 'GET' : 'POST').then((count) => {
      if (!cancelled && count !== null) setVisitCount(count)
    })

    const intervalId = window.setInterval(() => {
      fetchVisitCount('GET').then((count) => {
        if (!cancelled && count !== null) setVisitCount(count)
      })
    }, 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
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
          <a href="/player-scanner">{text.primeScanner}</a>
          <a href="#mobilador" className={activeSection === 'mobilador' ? 'active' : ''}>{text.nav[2]}</a>
          <a href="#descargas" className={activeSection === 'descargas' ? 'active' : ''}>{text.nav[3]}</a>
          <a href="#comunidad" className={activeSection === 'comunidad' ? 'active' : ''}>{text.nav[4]}</a>
          <a href="#contacto" className={activeSection === 'contacto' ? 'active' : ''}>{text.nav[5]}</a>
        </div>

        <a className="nav-cta" href={links.mobiladorDownload} download>{text.navDownloadCta}</a>
      </nav>

      {visitCount !== null && (
        <div className="visitor-counter" aria-label={String(visitCount)}>
          <PiEyeBold aria-hidden="true" />
          <strong>{visitCount}</strong>
        </div>
      )}

      <section id="inicio" className="hero">
        <div className="hero-card">
          <img src={logo} alt="Danivex Logo" className="hero-logo" />
          <h1>DANIVEX</h1>
          <p>{text.heroText}</p>

          <div className="buttons">
            <a href="#sensibilidad" className="btn primary">{text.primaryCta}</a>
            <a href="/player-scanner" className="btn secondary">{text.primeScanner}</a>
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

        <div className="sensi-how">
          <h3>{text.sensiHowTitle}</h3>
          <div className="sensi-how-grid">
            {text.sensiFactors.map((factor) => (
              <div className="sensi-how-item" key={factor.label}>
                <strong>{factor.label}</strong>
                <span>{factor.text}</span>
              </div>
            ))}
          </div>
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

      <section id="mobilador" className="section section-wide">
        <span className="eyebrow">{text.mobiladorEyebrow}</span>
        <h2>{text.mobiladorSectionTitle}</h2>
        <p>{text.mobiladorSectionText}</p>

        <ul className="mobilador-profiles">
          {text.mobiladorProfiles.map((profile) => (
            <li key={profile}>{profile}</li>
          ))}
        </ul>

        <div className="screenshot-gallery">
          <img src={mobiladorScreenInicio} alt={text.mobiladorShotHome} loading="lazy" />
          <img src={mobiladorScreenPerfiles} alt={text.mobiladorShotProfiles} loading="lazy" />
          <img src={mobiladorScreenAcercaDe} alt={text.mobiladorShotAbout} loading="lazy" />
        </div>

        <a className="btn primary" href="#descargas">{text.mobiladorShowcaseCta}</a>
      </section>

      <section id="descargas" className="section section-wide">
        <span className="eyebrow">{text.downloadsEyebrow}</span>
        <h2>{text.downloadsTitle}</h2>
        <p>{text.downloadsText}</p>

        <div className="download-card">
          <div className="download-media">
            <img src={mobiladorLogo} alt="DaniVex Mobilador" loading="lazy" />
          </div>
          <div className="download-info">
            <a className="btn primary download-btn" href={links.mobiladorDownload} download>
              {text.mobiladorButton}
            </a>
            <span className="download-note">{text.mobiladorNote}</span>
          </div>
        </div>
      </section>

      <section id="comunidad" className="section">
        <span className="eyebrow">{text.communityEyebrow}</span>
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
        <span className="eyebrow">{text.contactEyebrow}</span>
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

      <footer className="site-footer">
        <div className="site-footer-brand">
          <img src={logo} alt="Danivex Logo" />
          <span>{text.footerRights(new Date().getFullYear())}</span>
        </div>
        <nav className="site-footer-links" aria-label={text.nav[0]}>
          <a href="#inicio">{text.nav[0]}</a>
          <a href="#sensibilidad">{text.nav[1]}</a>
          <a href="/player-scanner">{text.primeScanner}</a>
          <a href="#mobilador">{text.nav[2]}</a>
          <a href="#comunidad">{text.nav[4]}</a>
        </nav>
      </footer>
    </div>
  )
}

export default HomePage

import { useEffect, useMemo, useRef, useState } from 'react'
import { PiChartBarBold, PiDeviceMobileBold, PiEyeBold, PiSlidersHorizontalBold, PiCopyBold, PiCheckBold } from 'react-icons/pi'
import SiteNav from '../components/SiteNav.jsx'
import SavePreset from '../account/SavePreset.jsx'
import PlatformHero from '../components/home/PlatformHero.jsx'
import ToolsSection from '../components/home/ToolsSection.jsx'
import MobiladorSection from '../components/home/MobiladorSection.jsx'
import CommunitySection from '../components/home/CommunitySection.jsx'
import { platformCopy } from '../data/ecosystem.js'
import { reactCompanion } from '../companion/config.js'
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
function getMaxExperienceYears(now = new Date()) {
  let years = now.getFullYear() - FREE_FIRE_RELEASE_DATE.getFullYear()
  const beforeReleaseDay =
    now.getMonth() < FREE_FIRE_RELEASE_DATE.getMonth()
    || (now.getMonth() === FREE_FIRE_RELEASE_DATE.getMonth() && now.getDate() < FREE_FIRE_RELEASE_DATE.getDate())

  if (beforeReleaseDay) years -= 1
  return Math.min(8, Math.max(0, years))
}

function getPreferredLanguage() {
  try {
    const saved = localStorage.getItem('danivex:language')
    if (['es', 'pt', 'en'].includes(saved)) return saved
  } catch { /* Browser language remains available. */ }
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
  const [language, setLanguage] = useState(getPreferredLanguage)
  const [devicePlatform, setDevicePlatform] = useState('android')
  const [catalogDevices, setCatalogDevices] = useState(devices)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState(false)
  const [search, setSearch] = useState(defaultDevice.name)
  const [selectedDevice, setSelectedDevice] = useState(defaultDevice)
  const [manualTier, setManualTier] = useState('mid')
  const [profile, setProfile] = useState(defaultProfile)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const copyTimer = useRef(null)
  const lastResultInputs = useRef({ device: defaultDevice, profile: defaultProfile })
  const [visitCount, setVisitCount] = useState(null)
  const [activeSection, setActiveSection] = useState('inicio')
  const text = copy[language]
  const words = platformCopy[language]
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
    try { localStorage.setItem('danivex:language', language) } catch { /* Optional preference. */ }
  }, [text.lang, language])

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
    let hasSession = false
    try {
      hasSession = Boolean(sessionStorage.getItem(sessionKey))
      if (!hasSession) sessionStorage.setItem(sessionKey, '1')
    } catch { /* The real visit API still works without browser storage. */ }

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

  useEffect(() => {
    if (lastResultInputs.current.device === selectedDevice && lastResultInputs.current.profile === profile) return undefined
    lastResultInputs.current = { device: selectedDevice, profile }
    const timer = window.setTimeout(() => reactCompanion('SUCCESS'), 900)
    return () => window.clearTimeout(timer)
  }, [selectedDevice, profile])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  function updateProfile(key, value) {
    reactCompanion('CHANGE')
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
    setCatalogError(false)
    try {
      const loadedDevices = await loadMassiveDeviceCatalog()
      setCatalogDevices(loadedDevices)
    } catch {
      setCatalogError(true)
    } finally {
      setIsCatalogLoading(false)
    }
  }

  function updateSelectedDevice(nextDevice) {
    reactCompanion('CHANGE')
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
      setCopyError(false)
      reactCompanion('SUCCESS')
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  return (
    <div className="page platform-page">
      <SiteNav activeSection={activeSection} language={language} onLanguage={setLanguage} />

      {visitCount !== null && (
        <div className="visitor-counter" aria-label={String(visitCount)}>
          <PiEyeBold aria-hidden="true" />
          <strong>{visitCount}</strong>
        </div>
      )}

      <main id="main-content">
      <PlatformHero language={language} />

      <section id="sensibilidad" className="tool-section" data-companion-section="sensibilidad" data-companion-side="right">
        <div className="section-heading">
          <h2>{text.toolTitle}</h2>
          <p>{text.toolText}</p>
        </div>

        <div className="senselab" data-companion-obstacle>
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

            <div className="suggestions" role="group" aria-label={text.searchModel}>
              {catalogError && <p className="catalog-error" role="status">{words.catalogError}</p>}
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

              <label className="field field-mode">
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
                {copied ? <PiCheckBold aria-hidden="true" /> : <PiCopyBold aria-hidden="true" />} {copied ? text.copied : text.copy}
              </button>
            </div>

            <p className="result-status"><span aria-hidden="true" />{words.liveResult}</p>
            <div className="result-grid" aria-live="polite" aria-atomic="true">
              {resultKeys.map((key) => (
                <div className="result-card" key={key}>
                  <span>{text.resultLabels[key]}</span>
                  <strong>{result.values[key]}<small>/ 200</small></strong>
                  <div className="result-meter" aria-hidden="true"><i style={{ transform: `scaleX(${result.values[key] / 200})` }} /></div>
                </div>
              ))}
            </div>

            {copyError && <p className="catalog-error" role="status">{words.copyError}</p>}
            <SavePreset language={language} device={selectedDevice} profile={profile} values={result.values} />
            <details className="coach">
              <summary>{words.details}</summary>
              <p>
              <strong>{text.coachStart}</strong> {result.reasons.join(' ')}
              {' '}{text.coachEnd}
              </p>
            </details>
          </div>
        </div>
        <details className="sensi-how" data-companion-obstacle>
          <summary>{text.sensiHowTitle}</summary>
          <div className="sensi-how-grid">
            {text.sensiFactors.map((factor) => (
              <div className="sensi-how-item" key={factor.label}>
                <strong>{factor.label}</strong>
                <span>{factor.text}</span>
              </div>
            ))}
          </div>
        </details>

      </section>

      <ToolsSection language={language} />
      <MobiladorSection language={language} />
      <CommunitySection language={language} />
      </main>
    </div>
  )
}

export default HomePage

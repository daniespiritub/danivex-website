import { useState } from 'react'
import { PiArrowRightBold, PiAndroidLogoBold, PiDesktopBold, PiArrowUpRightBold, PiDownloadSimpleBold } from 'react-icons/pi'
import screenInicio from '../../assets/mobilador-screens/inicio.png'
import screenPerfiles from '../../assets/mobilador-screens/perfiles.png'
import screenAcerca from '../../assets/mobilador-screens/acerca-de.png'
import mobiladorLogo from '../../assets/mobilador-logo.webp'
import { mobilador, platformCopy } from '../../data/ecosystem.js'
import { copy } from '../../data/copy.js'
import { reactCompanion } from '../../companion/config.js'

const screens = [screenInicio, screenPerfiles, screenAcerca]

export default function MobiladorSection({ language }) {
  const [screen, setScreen] = useState(0)
  const text = copy[language]
  const words = platformCopy[language]
  const alt = [text.mobiladorShotHome, text.mobiladorShotProfiles, text.mobiladorShotAbout]
  return (
    <>
      <section id="mobilador" className="mobilador-section" data-companion-section="mobilador" data-companion-side="right">
        <div className="platform-section">
          <div className="product-heading" data-companion-obstacle>
            <img src={mobiladorLogo} alt="" width="48" height="48" loading="lazy" />
            <h2>DaniVex Mobilador</h2><span>Windows</span>
          </div>
          <div className="mobilador-showcase">
            <div className="mobilador-copy" data-companion-obstacle>
              <h3>{words.mobileToPc}</h3>
              <p>{words.mobiladorText}</p>
              <div className="connection-flow" aria-label="Android a Windows">
                <span><PiAndroidLogoBold aria-hidden="true" /> Android</span><PiArrowRightBold aria-hidden="true" /><span><PiDesktopBold aria-hidden="true" /> PC</span>
              </div>
              <ul className="mobilador-profiles">{text.mobiladorProfiles.map((profile) => <li key={profile}>{profile}</li>)}</ul>
              <a className="btn primary" href="#descargas"><PiDownloadSimpleBold aria-hidden="true" />{text.mobiladorShowcaseCta}</a>
            </div>
            <div className="product-preview" data-companion-obstacle>
              <div className="preview-tabs" role="tablist" aria-label="DaniVex Mobilador">
                {words.screenTabs.map((label, index) => <button type="button" role="tab" key={index} id={`screen-tab-${index}`}
                  aria-controls="mobilador-screen" aria-selected={screen === index} tabIndex={screen === index ? 0 : -1}
                  onKeyDown={(e) => {
                    const next = e.key === 'ArrowRight' ? (screen + 1) % 3 : e.key === 'ArrowLeft' ? (screen + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : null
                    if (next !== null) { e.preventDefault(); setScreen(next); document.getElementById(`screen-tab-${next}`)?.focus() }
                  }} onClick={() => { setScreen(index); reactCompanion('CHANGE') }}>{label}</button>)}
              </div>
              <div className="product-screen" role="tabpanel" id="mobilador-screen" aria-labelledby={`screen-tab-${screen}`}>
                <a href={screens[screen]} target="_blank" rel="noreferrer"><img src={screens[screen]} alt={alt[screen]} loading="lazy" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="descargas" className="platform-section downloads-section" data-companion-section="descargas" data-companion-side="left">
        <div className="section-heading"><h2>{words.downloadTitle}</h2><p>{text.downloadsText}</p></div>
        <article className="release-row" data-companion-obstacle>
          <img src={mobiladorLogo} alt="" width="64" height="64" loading="lazy" />
          <div className="release-identity"><h3>{mobilador.name}</h3><p>{text.mobiladorNote}</p>
            <a href={mobilador.releaseUrl} target="_blank" rel="noreferrer">{words.release} <PiArrowUpRightBold aria-hidden="true" /></a>
          </div>
          <div className="release-version"><span>{words.version}</span><strong>{mobilador.version}</strong></div>
          <a className="btn primary" href={mobilador.downloadUrl} download><PiDownloadSimpleBold aria-hidden="true" />{text.navDownloadCta}</a>
        </article>
      </section>
    </>
  )
}

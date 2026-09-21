import { PiArrowUpRightBold, PiSlidersHorizontalBold, PiUserFocusBold, PiDesktopBold } from 'react-icons/pi'
import { platformCopy, tools } from '../../data/ecosystem.js'

const icons = { tune: PiSlidersHorizontalBold, scan: PiUserFocusBold, desktop: PiDesktopBold }

export default function PlatformHero({ language }) {
  const text = platformCopy[language]
  return (
    <section id="inicio" className="platform-hero" data-companion-section="inicio">
      <div className="hero-inner">
        <div className="hero-title-row">
          <div className="hero-copy" data-companion-obstacle>
            <h1>DANIVEX<span className="brand-dot">.</span></h1>
            <h2>{text.purpose}</h2>
            <p>{text.hero}</p>
          </div>
          <div data-companion-anchor data-companion-framing="portrait" aria-hidden="true" />
        </div>
        <div className="hero-shortcuts" aria-label={text.tools} data-companion-obstacle>
          {tools.map((tool) => {
            const Icon = icons[tool.icon]
            return <a key={tool.id} href={tool.href} className={`hero-shortcut shortcut-${tool.id}`}>
              <Icon className="shortcut-icon" aria-hidden="true" />
              <span><strong>{tool.name[language]}</strong><small>{tool.platform}</small></span>
              <PiArrowUpRightBold className="shortcut-arrow" aria-hidden="true" />
            </a>
          })}
        </div>
      </div>
    </section>
  )
}

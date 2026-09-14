import { PiArrowUpRightBold, PiSlidersHorizontalBold, PiUserFocusBold, PiDesktopBold } from 'react-icons/pi'
import { tools, platformCopy } from '../../data/ecosystem.js'

const icons = { tune: PiSlidersHorizontalBold, scan: PiUserFocusBold, desktop: PiDesktopBold }

export default function ToolsSection({ language }) {
  const text = platformCopy[language]
  return (
    <section id="herramientas" className="platform-section tools-section" data-companion-section="herramientas" data-companion-side="left">
      <div className="section-heading"><h2>DaniVex Tools</h2><p>{text.toolsText}</p></div>
      <div className="tool-directory" data-companion-obstacle>
        {tools.map((tool) => {
          const Icon = icons[tool.icon]
          return <a className="tool-directory-row" href={tool.href} key={tool.id}>
            <Icon className="directory-icon" aria-hidden="true" />
            <div><h3>{tool.name[language]}</h3><p>{tool.description[language]}</p></div>
            <span className="directory-platform">{tool.platform}</span>
            <PiArrowUpRightBold aria-hidden="true" />
          </a>
        })}
      </div>
    </section>
  )
}

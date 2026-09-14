import { useEffect, useRef, useState } from 'react'
import { PiListBold, PiXBold, PiArrowDownBold } from 'react-icons/pi'
import logo from '../assets/logo.webp'
import { copy } from '../data/copy.js'
import { platformCopy } from '../data/ecosystem.js'

export default function SiteNav({ activeSection, language = 'es', onLanguage, scanner = false }) {
  const [open, setOpen] = useState(false)
  const nav = useRef(null)
  const toggle = useRef(null)
  const text = copy[language]
  const words = platformCopy[language]
  const prefix = scanner ? '/' : ''
  const items = [
    { href: `${prefix}#sensibilidad`, id: 'sensibilidad', label: text.nav[1] },
    { href: '/player-scanner', id: 'scanner', label: text.primeScanner },
    { href: `${prefix}#herramientas`, id: 'herramientas', label: 'Tools' },
    { href: `${prefix}#mobilador`, id: 'mobilador', label: 'Mobilador' },
    { href: `${prefix}#comunidad`, id: 'comunidad', label: text.community },
  ]
  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') { setOpen(false); toggle.current?.focus() }
      if (event.type === 'pointerdown' && !nav.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', close)
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close) }
  }, [open])
  return (
    <nav className="navbar" ref={nav} aria-label={words.menu}>
      <a className="skip-link" href={scanner ? '#player-uid-input' : '#sensibilidad'}>{words.skip}</a>
      <div className="nav-inner">
        <a className="brand" href={scanner ? '/' : '#inicio'} aria-label={`DaniVex · ${words.home}`}>
          <img src={logo} alt="" width="36" height="36" /><span>DANIVEX</span>
        </a>
        <div className="menu" id="site-menu" data-open={open}>
          {items.map((item) => <a key={item.id} href={item.href} onClick={() => setOpen(false)}
            className={activeSection === item.id ? 'active' : ''} aria-current={activeSection === item.id ? 'location' : undefined}>{item.label}</a>)}
          <a className="nav-contact" href={`${prefix}#contacto`} onClick={() => setOpen(false)}>{text.nav[5]}</a>
        </div>
        <div className="nav-actions">
          {onLanguage && <select aria-label={words.language} value={language} className="language-select" onChange={(e) => onLanguage(e.target.value)}>
            <option value="es">ES</option><option value="pt">PT</option><option value="en">EN</option>
          </select>}
          <a className="nav-cta" href={`${prefix}#descargas`}><PiArrowDownBold aria-hidden="true" /><span>{text.navDownloadCta}</span></a>
          <span data-companion-dock aria-hidden="true" />
          <button ref={toggle} className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-menu"
            aria-label={open ? words.closeMenu : words.menu} onClick={() => setOpen((value) => !value)}>
            {open ? <PiXBold aria-hidden="true" /> : <PiListBold aria-hidden="true" />}
          </button>
        </div>
      </div>
    </nav>
  )
}

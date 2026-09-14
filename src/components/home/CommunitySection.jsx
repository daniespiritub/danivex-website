import { FaDiscord, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import { PiArrowUpRightBold } from 'react-icons/pi'
import { platformCopy, socialLinks } from '../../data/ecosystem.js'
import { copy } from '../../data/copy.js'
import logo from '../../assets/logo.webp'

export default function CommunitySection({ language }) {
  const text = copy[language]
  const words = platformCopy[language]
  return (
    <>
      <section id="comunidad" className="community-section" data-companion-section="comunidad" data-companion-side="left">
        <div className="platform-section community-inner">
          <div className="section-heading" data-companion-obstacle><h2>{words.communityTitle}</h2><p>{words.communityText}</p></div>
          <div className="community-channels" data-companion-obstacle>
            <a className="community-link discord" href={socialLinks.discord} target="_blank" rel="noreferrer"><FaDiscord aria-hidden="true" /><strong>{text.discordServer}</strong><PiArrowUpRightBold aria-hidden="true" /></a>
            <a className="community-link whatsapp" href={socialLinks.whatsapp} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /><strong>{text.whatsapp}</strong><PiArrowUpRightBold aria-hidden="true" /></a>
          </div>
        </div>
      </section>
      <section id="contacto" className="platform-section contact-section" data-companion-section="contacto">
        <h2>{words.connect}</h2>
        <div className="social-actions contact-actions">
          <a className="social-button" href={socialLinks.instagram} target="_blank" rel="noreferrer"><FaInstagram aria-hidden="true" /><span>{text.instagram}</span></a>
          <a className="social-button" href={socialLinks.tiktokMain} target="_blank" rel="noreferrer"><FaTiktok aria-hidden="true" /><span>{text.tiktokMain}</span></a>
          <a className="social-button" href={socialLinks.tiktokSecond} target="_blank" rel="noreferrer"><FaTiktok aria-hidden="true" /><span>{text.tiktokSecond}</span></a>
        </div>
      </section>
      <footer className="site-footer" data-companion-section="footer">
        <div className="site-footer-brand"><img src={logo} alt="" width="28" height="28" /><span>{text.footerRights(new Date().getFullYear())}</span></div>
        <nav className="site-footer-links" aria-label={text.nav[0]}>
          <a href="#inicio">{text.nav[0]}</a><a href="#sensibilidad">{text.nav[1]}</a><a href="/player-scanner">{text.primeScanner}</a><a href="#descargas">{text.nav[3]}</a>
        </nav>
      </footer>
    </>
  )
}

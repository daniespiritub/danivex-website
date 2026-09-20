import SiteNav from '../components/SiteNav.jsx'
import { privacySections } from '../data/privacy.js'
import '../account/account.css'

export default function PrivacyPage() {
  return <><SiteNav scanner skipTarget="main-content" /><main id="main-content" className="account-main" data-companion-obstacle><h1>Privacidad en DaniVex</h1>
    {privacySections.map((section) => <section className="account-settings-section" key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
    <p><a href="/#contacto">Contactar con DaniVex</a></p>
  </main></>
}

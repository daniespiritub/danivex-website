import SiteNav from '../components/SiteNav.jsx'
import '../styles/redmagic-root.css'
import { socialLinks } from '../data/ecosystem.js'
import fastbootUnlocked from '../assets/redmagic-guide/fastboot-unlocked.webp'

const OTROS_MODELOS = [
  { modelo: 'RedMagic Mars', chip: 'Snapdragon 845', notas: '—' },
  { modelo: 'RedMagic 3, 3S', chip: 'Snapdragon 855', notas: '—' },
  { modelo: 'RedMagic 5G, 5S', chip: 'Snapdragon 865', notas: '—' },
  { modelo: 'RedMagic 6, 6Pro, 6SPro', chip: 'Snapdragon 888', notas: '—' },
  { modelo: 'RedMagic 7, 7Pro', chip: 'Snapdragon 8 Gen1', notas: '—' },
  { modelo: 'RedMagic 7S, 7SPro', chip: 'Snapdragon 8+', notas: '—' },
  { modelo: 'RedMagic 8系列', chip: 'Snapdragon 8 Gen2', notas: 'Version 国行 (China) e internacional, mismo grupo' },
  { modelo: 'RedMagic 9系列', chip: 'Snapdragon 8 Gen3', notas: '—' },
  { modelo: 'RedMagic 10Air', chip: 'Snapdragon 8 Gen3', notas: 'En versiones viejas del toolbox figuraba como "no soportado" — confirma en el menu de tu version antes de empezar' },
  { modelo: 'RedMagic 10Pro, 10Pro+, 10SPro, 10SPro+', chip: 'Snapdragon 8 Elite / 8 Elite+', notas: 'Guia completa abajo' },
  { modelo: 'RedMagic 11Air', chip: 'Snapdragon 8 Elite', notas: '—' },
  { modelo: 'RedMagic 11Pro, 11Pro+, 11SPro, 11SPro+', chip: 'Snapdragon 8 Elite Gen5', notas: 'Guia completa abajo' },
  { modelo: 'RedMagic 电竞平板 (tablets: 一代, Pro, 3Pro)', chip: 'varia por generacion', notas: 'Mismo toolbox, menu de modelo separado para tablets' },
]

export default function RootRedMagicIndex() {
  return (
    <>
      <SiteNav scanner skipTarget="main-content" />
      <main id="main-content" className="rm-main" data-companion-obstacle>

        <section className="rm-hero">
          <div className="rm-eyebrow-row">
            <span className="rm-eyebrow">Guia DaniVex · gratis</span>
          </div>
          <h1>Root a tu REDMAGIC<br /><em>sin pagar un centavo.</em></h1>
          <p className="lead">Desbloquear el bootloader y rootear un RedMagic se puede hacer vos mismo, sin pagar un &quot;servicio tecnico&quot; por algo que son basicamente herramientas en chino y un rato de paciencia. Elegi tu modelo abajo — cada guia tiene los pasos exactos, con capturas reales del proceso.</p>
          <div className="rm-stats">
            <div className="rm-stat"><b>$0</b><span>costo real</span></div>
            <div className="rm-stat"><b>1-3h</b><span>tiempo estimado</span></div>
            <div className="rm-stat"><b>2</b><span>guias completas</span></div>
          </div>

          <figure className="rm-hero-shot">
            <img src={fastbootUnlocked} alt="Pantalla FastBoot Mode de un REDMAGIC mostrando DEVICE STATE - unlocked" />
            <figcaption>Captura real del telefono — no es una recreacion.</figcaption>
          </figure>
        </section>

        <section className="rm-phase" style={{ marginTop: 0 }}>
          <div className="rm-phase-head"><span className="rm-phase-num">00</span><div><h2>Elegi tu modelo</h2><p className="sub">Cada uno tiene su propia guia completa</p></div></div>
          <div className="rm-picker">
            <a className="rm-model-card" href="/root-redmagic-11-pro">
              <span className="chip">Guia completa</span>
              <h3>RedMagic 11 Pro</h3>
              <p>Desbloqueo por exploit de firmware + downgrade quirurgico de una sola particion.</p>
              <div className="spec">NX809J · Snapdragon 8 Elite Gen5 · Android 16</div>
            </a>
            <a className="rm-model-card" href="/root-redmagic-10s-pro">
              <span className="chip">Guia completa</span>
              <h3>RedMagic 10S Pro</h3>
              <p>Desbloqueo directo desde el toolbox, con driver especifico y modo EDL por ADB.</p>
              <div className="spec">NX789J · Snapdragon 8 Elite+ · Android 15</div>
            </a>
          </div>
        </section>

        <section className="rm-phase" id="otros-modelos">
          <div className="rm-phase-head"><span className="rm-phase-num">01</span><div><h2>Otros modelos</h2><p className="sub">El mismo toolbox cubre toda la familia RedMagic, no solo estos dos</p></div></div>
          <p><strong>ZTE Family Toolbox</strong> no es exclusivo del 11 Pro ni del 10S Pro — es una herramienta unica que cubre toda la linea RedMagic (y los Axon/nubia Z de la misma fabrica). El flujo general es el mismo en todos: instalar el driver correcto, entrar a modo 9008/EDL, desbloquear desde el menu del modelo, y rootear con el Magisk integrado. Lo que cambia es el numero de menu y, en los modelos mas viejos, si el exploit de desbloqueo sigue vigente para tu build.</p>
          <div className="rm-callout">
            <span className="tag">Importante sobre los numeros de menu</span>
            <p>El numero que le corresponde a cada modelo <strong>cambia entre versiones del toolbox</strong> — nos paso entre dos versiones distintas haciendo estas mismas guias. No memorices un numero: al abrir el toolbox, elegi tu modelo por el <strong>nombre y chipset</strong> que aparecen en pantalla, no por una posicion fija.</p>
          </div>
          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead><tr><th>Modelo</th><th>Chipset</th><th>Notas</th></tr></thead>
              <tbody>
                {OTROS_MODELOS.map((row) => (
                  <tr key={row.modelo}>
                    <td className="strong">{row.modelo}</td>
                    <td>{row.chip}</td>
                    <td>{row.notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Para cualquiera de estos: segui la <strong>Fase 00 (Preparar la PC)</strong> de cualquiera de las dos guias tal cual, y despues usa como referencia los pasos del 10S Pro — es el proceso mas directo y el que menos depende de la version exacta de tu firmware. Si tu modelo es de la serie 7 para atras, puede que necesites algo parecido al downgrade de particion que se explica en la guia del 11 Pro, segun que tan reciente sea tu build.</p>
        </section>

        <section className="rm-phase" id="ayuda" style={{ marginBottom: 20 }}>
          <div className="rm-phase-head"><span className="rm-phase-num">02</span><div><h2>¿Te trabaste?</h2><p className="sub">Antes de escribirme, ten esto a mano</p></div></div>
          <p>Si te confundis en algun paso o no sabes como seguir, con gusto te ayudo directamente. Entra a la guia de tu modelo primero — ahi esta la seccion de Recursos con todo lo que vas a necesitar tener descargado antes de contactarme.</p>
          <div className="rm-help-row">
            <a className="rm-help-btn tiktok" href={socialLinks.tiktokMain} target="_blank" rel="noopener noreferrer">TikTok — @.mashesp</a>
            <a className="rm-help-btn discord" href={socialLinks.discord} target="_blank" rel="noopener noreferrer">Discord</a>
          </div>
        </section>

        <div className="rm-footer-note">
          <span>Escrito a partir de procesos reales, documentados paso a paso por DaniVex. Compartelo si le ahorra dinero a alguien.</span>
          <code className="mono">NX809J · NX789J</code>
        </div>

      </main>
    </>
  )
}

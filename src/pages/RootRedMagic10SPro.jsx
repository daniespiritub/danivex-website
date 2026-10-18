import { useState } from 'react'
import SiteNav from '../components/SiteNav.jsx'
import '../styles/redmagic-root.css'
import { socialLinks } from '../data/ecosystem.js'
import toolboxDownload from '../assets/redmagic-guide/10spro-toolbox-download.webp'
import qusbBulk from '../assets/redmagic-guide/10spro-qusb-bulk.webp'
import fastbootLocked from '../assets/redmagic-guide/10spro-fastboot-locked.webp'
import fastbootUnlocked from '../assets/redmagic-guide/10spro-fastboot-unlocked.webp'
import magiskVersion from '../assets/redmagic-guide/10spro-magisk-version.webp'
import superuserOff from '../assets/redmagic-guide/10spro-superuser-off.webp'
import superuserOn from '../assets/redmagic-guide/10spro-superuser-on.webp'

// Foto real con su etiqueta, para las capturas del proceso (no mockups).
function Shot({ src, alt, caption, wide }) {
  return (
    <figure className={`rm-shot${wide ? ' wide' : ''}`}>
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

// Bloque de comandos con boton de copiar. Sin librerias externas: solo
// navigator.clipboard, con fallback silencioso si el host lo bloquea.
function Term({ label, children, copy }) {
  const [copied, setCopied] = useState(false)
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(copy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* clipboard no disponible, no pasa nada */ }
  }
  return (
    <div className="rm-term">
      <div className="rm-term-bar">
        <span>{label}</span>
        {copy && <button type="button" className="rm-term-copy" onClick={onCopy}>{copied ? 'copiado' : 'copiar'}</button>}
      </div>
      <pre>{children}</pre>
    </div>
  )
}

const RECURSOS = [
  { tool: 'Platform-Tools', use: 'adb / fastboot', href: 'https://developer.android.com/tools/releases/platform-tools', label: 'developer.android.com (oficial Google)' },
  { tool: 'Driver especifico ZTE', use: 'Reconocer modo EDL/9008 en este modelo', href: null, label: 'incluido dentro de ZTE Family Toolbox (archivo 刷机驱动和运行库.txt)' },
  { tool: 'Magisk', use: 'Parchear init_boot y dar root', href: 'https://github.com/topjohnwu/Magisk/releases', label: 'github.com/topjohnwu (oficial) — tambien viene integrado en el toolbox' },
  { tool: 'ZTE Family Toolbox', use: 'Desbloqueo BL + root + flasheo por EDL', href: 'https://xdaforums.com/t/red-magic-11-pro-guide-bootloader-unlock-free-also-support-rm10-pad3pro-z70u-z80u-unlock-zte-family-toolbox.4780930/', label: 'hilo oficial en XDA Forums — comunitaria, revisa el hash antes de correrla' },
  { tool: 'Descarga directa del toolbox', use: 'Todas las versiones, para no andar buscandola', href: 'https://syxz.lanzoue.com/b01g0i33c', label: 'syxz.lanzoue.com — usa siempre la mas reciente arriba de todo, boton 普通下载' },
]

const TROUBLESHOOTING = [
  { p: 'QUSB_BULK sin reconocer en el Administrador de dispositivos', why: 'Este modelo enumera bajo el ID de fabricante de ZTE (VID_19D2), no el generico de Qualcomm (VID_05C6)', s: 'Instalar el driver especifico que trae el toolbox, no uno generico de Qualcomm' },
  { p: 'La combinacion de botones no entra a EDL', why: 'Depende mucho del timing exacto', s: 'Usar adb reboot edl con el telefono booteado y depuracion USB activa' },
  { p: 'adb shell su -c id devuelve Permission denied', why: 'El acceso de Shell en Magisk queda desactivado por defecto la primera vez', s: 'Magisk → Superusuario → activar el acceso para [SharedUID] Shell' },
  { p: 'PC no reconoce el modo 9008', why: 'Falta el driver correcto, o Windows perdio la asociacion tras desconectar el cable', s: 'Reinstalar el driver y revisar el Administrador de dispositivos' },
  { p: 'No se ve claro si el desbloqueo funciono', why: 'No es concluyente por si solo', s: 'Revisar DEVICE STATE en fastboot — ese campo es el unico 100% confiable' },
]

export default function RootRedMagic10SPro() {
  return (
    <>
      <SiteNav scanner skipTarget="main-content" />
      <main id="main-content" className="rm-main" data-companion-obstacle>

        <section className="rm-hero">
          <div className="rm-eyebrow-row">
            <span className="rm-eyebrow">Guia DaniVex · gratis</span>
            <span className="rm-eyebrow rm-eyebrow-alt">Cubre 10Pro, 10Pro+, 10SPro y 10SPro+</span>
          </div>
          <h1>Root a tu REDMAGIC 10S Pro<br /><em>sin pagar un centavo.</em></h1>
          <p className="lead">El RedMagic 10S Pro (NX789J) se desbloquea y rootea directo desde el toolbox, sin necesitar downgrade de firmware como otros modelos. El unico tramo delicado es el driver del modo EDL — el resto es bastante directo.</p>
          <div className="rm-stats">
            <div className="rm-stat"><b>$0</b><span>costo real</span></div>
            <div className="rm-stat"><b>~1h</b><span>tiempo estimado</span></div>
            <div className="rm-stat"><b>1</b><span>traba real, resuelta</span></div>
          </div>

          <figure className="rm-hero-shot">
            <img src={fastbootUnlocked} alt="Pantalla FastBoot Mode del REDMAGIC 10S Pro mostrando DEVICE STATE - unlocked" />
            <figcaption>Captura real del telefono — no es una recreacion.</figcaption>
          </figure>
        </section>

        <div className="rm-toc">
          <p>En esta guia</p>
          <ol>
            <li><a href="#requisitos">00 · Requisitos</a></li>
            <li><a href="#fase-1">01 · Preparar la PC</a></li>
            <li><a href="#fase-2">02 · Conseguir el toolbox</a></li>
            <li><a href="#fase-3">03 · El driver correcto</a></li>
            <li><a href="#fase-4">04 · Entrar a modo EDL</a></li>
            <li><a href="#fase-5">05 · Desbloqueo</a></li>
            <li><a href="#fase-6">06 · Root con Magisk</a></li>
            <li><a href="#resumen">07 · Resumen de trabas</a></li>
            <li><a href="#recursos">08 · Recursos</a></li>
            <li><a href="#ayuda">09 · ¿Te trabaste?</a></li>
          </ol>
        </div>

        <section className="rm-phase" id="requisitos">
          <div className="rm-phase-head"><span className="rm-phase-num">00</span><div><h2>Antes de empezar</h2><p className="sub">Lo que necesitas, y lo que tienes que aceptar</p></div></div>
          <p>Verificado en el <strong>REDMAGIC 10S Pro (NX789J)</strong>, Snapdragon 8 Elite+. Cubre toda la familia <code className="mono">10Pro / 10Pro+ / 10SPro / 10SPro+</code> dentro del mismo toolbox, bajo el mismo menu de modelo.</p>
          <ul>
            <li>PC con <strong>Windows 10/11 de 64 bits</strong> y PowerShell.</li>
            <li>Cable USB en buen estado — nada de cargadores baratos sin datos.</li>
            <li>El telefono con bateria arriba del 50%.</li>
            <li>Unos 45 MB para el toolbox, mas lo que pese Magisk (ya incluido ahi mismo).</li>
          </ul>
          <div className="rm-callout">
            <span className="tag">Leer esto primero</span>
            <p>Desbloquear el bootloader <strong>borra todos los datos del telefono</strong>. Hace un respaldo completo antes de tocar nada (<code className="mono">adb pull /sdcard/ respaldo/</code>) y cierra sesion de Google y de tu cuenta nubia/ZTE antes de empezar — si no, el telefono puede quedar bloqueado por FRP despues del desbloqueo. Tambien se pierde la garantia oficial. Nadie te puede garantizar cero riesgo — nosotros tampoco. Lo hacemos con cuidado, no a ciegas.</p>
          </div>
        </section>

        <section className="rm-phase" id="fase-1">
          <div className="rm-phase-head"><span className="rm-phase-num">01</span><div><h2>Preparar la PC</h2><p className="sub">Las herramientas base</p></div></div>
          <p>Instala <strong>Android SDK Platform-Tools</strong> (adb + fastboot) directo de Google (enlace en Recursos, al final).</p>
          <p>Activa <strong>Depuracion USB</strong> en el telefono: Ajustes → Acerca del telefono → toca 7 veces &quot;Numero de compilacion&quot; (o version de build) hasta que diga &quot;Ya eres desarrollador&quot; → Opciones de desarrollador → Depuracion USB. Cuando conectes el cable va a pedir autorizar la PC — aceptalo y marca &quot;Confiar siempre en esta computadora&quot;.</p>
        </section>

        <section className="rm-phase" id="fase-2">
          <div className="rm-phase-head"><span className="rm-phase-num">02</span><div><h2>Conseguir el toolbox y elegir tu modelo</h2><p className="sub">Un detalle que cambia entre versiones</p></div></div>
          <p><strong>ZTE Family Toolbox</strong> se descarga desde un enlace de lanzou (ver Recursos). Usa el boton <strong>普通下载</strong> (descarga normal) — los otros dos son para lineas de operadores chinos especificos y pueden pedir login.</p>
          <Shot src={toolboxDownload} alt="Pagina de descarga de lanzou mostrando ZTE Family Toolbox 1.2.9-beta1 con el boton 普通下载 resaltado" caption="Descarga con 普通下载 — los otros dos botones son para operadores especificos." />
          <p>Descomprime el <code className="mono">.7z</code> en una ruta corta y sin espacios (por ejemplo <code className="mono">C:\ZTE\Toolbox</code>) y abre el <code className="mono">.bat</code>. En el selector de modelo elige <strong>红魔10系列</strong> (serie RedMagic 10) — no confundas con el 10Air (chip distinto) ni con el 11系列 (chip mas nuevo).</p>
        </section>

        <section className="rm-phase" id="fase-3">
          <div className="rm-phase-head"><span className="rm-phase-num">03</span><div><h2>El driver correcto</h2><p className="sub">La parte donde mas gente se traba</p></div></div>
          <p>Para que la PC reconozca el telefono en modo 9008, Windows necesita el driver Qualcomm HS-USB QDLoader correcto. En este modelo hay un detalle importante.</p>
          <div className="rm-snagfix">
            <div className="line" />
            <div className="boxes">
              <div className="rm-box snag"><span className="tag">Puede pasarte esto</span><p>Si instalas un driver Qualcomm generico y el dispositivo sigue apareciendo en el Administrador de dispositivos como <code className="mono">QUSB_BULK</code> (sin reconocer), es porque este modelo enumera bajo el ID de fabricante de ZTE (<code className="mono">VID_19D2</code>), no el generico de Qualcomm (<code className="mono">VID_05C6</code>). Un driver Qualcomm cualquiera no lo va a resolver.</p></div>
              <div className="rm-box fix"><span className="tag">Asi se evita</span><p>Usa el driver especifico que trae el propio toolbox (archivo <code className="mono">刷机驱动和运行库.txt</code> en su carpeta, con el link de descarga). Instalalo, reinicia si lo pide, y reconecta el telefono en modo EDL — ahi si deberia aparecer como &quot;Qualcomm HS-USB QDLoader 9008 (COMx)&quot;.</p></div>
            </div>
          </div>
          <Shot src={qusbBulk} alt="Administrador de dispositivos mostrando QUSB_BULK_CID:045A_SN sin reconocer" caption="Asi se ve el dispositivo sin el driver correcto." />
        </section>

        <section className="rm-phase" id="fase-4">
          <div className="rm-phase-head"><span className="rm-phase-num">04</span><div><h2>Entrar a modo EDL</h2><p className="sub">El camino corto: por ADB, no por botones</p></div></div>
          <p>Con el driver instalado y el telefono booteado normal con depuracion USB activa, el metodo mas confiable para entrar a EDL en este modelo es directo por comando — mucho mas consistente que las combinaciones de botones:</p>
          <Term label="PowerShell — PC" copy="adb reboot edl">
            <span className="prompt-char">PS&gt;</span> <span className="cmd">adb reboot edl</span>
          </Term>
          <p>La pantalla queda completamente negra — asi se ve EDL en este modelo, sin interfaz ni luz. Confirma en el Administrador de dispositivos, seccion &quot;Puertos (COM y LPT)&quot;: debe decir <strong>Qualcomm HS-USB QDLoader 9008</strong>.</p>
          <div className="rm-callout">
            <span className="tag">Si el telefono no bootea (esta trabado)</span>
            <p>La alternativa por botones es: telefono completamente apagado → mantener <strong>Volumen Arriba + Volumen Abajo</strong> juntos → conectar el cable mientras los sostienes, unos 5-8 segundos. Funciona, pero depende mas del timing que el metodo por ADB.</p>
          </div>
        </section>

        <section className="rm-phase" id="fase-5">
          <div className="rm-phase-head"><span className="rm-phase-num">05</span><div><h2>Desbloqueo</h2><p className="sub">Automatico una vez que el driver y el EDL estan resueltos</p></div></div>
          <p>En el menu del modelo (红魔10系列), elige <code className="mono">0. 解锁BL</code>. El toolbox pide arrancar el proceso desde sistema (opcion recomendada <code className="mono">1.从系统开始</code>) para leer la info del dispositivo, y despues el mismo maneja los reinicios a 9008 para hacer el backup de particiones, modificar lo necesario, y reiniciar a Fastboot.</p>
          <Term label="ZTE Family Toolbox — resumen del log">
            设备代号：NX789J{'\n'}安卓版本：15{'\n'}当前槽位：a{'\n'}重启到9008...{'\n'}备份frp...{'\n'}备份gpt_main4...{'\n'}备份abl_a...{'\n'}备份boot_a...{'\n'}修改gpt_main4...{'\n'}刷入旧版abl...{'\n'}刷入解锁uefi...{'\n'}刷入解锁frp...{'\n'}重启...
          </Term>
          <p>En Fastboot vas a ver el aviso estandar de Android y tienes que confirmar en la pantalla fisica del telefono:</p>
          <Term label="Pantalla del telefono">
            By unlocking the bootloader, you will be able to{'\n'}install custom operating system on this phone...{'\n\n'}Press the Volume keys to select whether to unlock{'\n'}the bootloader, then the Power Button to continue.{'\n\n'}DO NOT UNLOCK THE BOOTLOADER{'\n'}<span className="ok">UNLOCK THE BOOTLOADER</span>
          </Term>
          <p>Navega con volumen hasta <strong>UNLOCK THE BOOTLOADER</strong> y confirma con el boton de encendido. El toolbox termina solo restaurando particiones, activando el slot y haciendo el reset de fabrica. El primer arranque despues de esto es mas lento de lo normal — es esperado.</p>
          <div className="rm-shot-pair">
            <Shot src={fastbootLocked} alt="Pantalla Fastboot del RedMagic 10S Pro mostrando DEVICE STATE locked, antes del proceso" caption="Antes: DEVICE STATE - locked" />
            <Shot src={fastbootUnlocked} alt="Pantalla Fastboot del mismo RedMagic 10S Pro mostrando DEVICE STATE unlocked, despues del proceso" caption="Despues: DEVICE STATE - unlocked" />
          </div>
        </section>

        <section className="rm-phase" id="fase-6">
          <div className="rm-phase-head"><span className="rm-phase-num">06</span><div><h2>Root con Magisk</h2><p className="sub">Totalmente integrado en el toolbox para este modelo</p></div></div>
          <p>Con el telefono booteado y la depuracion USB reactivada (el reset de fabrica la apaga, hay que prenderla de nuevo), vuelve al menu del toolbox → <code className="mono">1. 获取Root</code> → <code className="mono">1. [Recomendado] usar el Magisk integrado</code>. El toolbox hace todo el ciclo solo: conecta por ADB, respalda <code className="mono">init_boot_a</code>, lo parchea con Magisk, lo reflashea por EDL y reinicia.</p>
          <Term label="ZTE Family Toolbox — resumen del log">
            备份init_boot_a...{'\n'}文件已备份到bin\res\NX789J\bak.{'\n'}Magisk修补...{'\n'}刷入init_boot_a...{'\n'}重启...
          </Term>
          <p>Al volver a bootear, la app Magisk ya deberia mostrar la version instalada, y puede pedir un reinicio extra para terminar de configurarse — es normal, aceptalo.</p>
          <Shot src={magiskVersion} alt="App Magisk mostrando version instalada 29.0 y Ramdisk: Si en un RedMagic 10S Pro" caption="Magisk confirmando la instalacion en el telefono real." />
          <p>Verificacion final desde la PC:</p>
          <Term label="PowerShell — PC" copy="adb shell su -c id">
            <span className="prompt-char">PS&gt;</span> <span className="cmd">adb shell su -c id</span>{'\n'}uid=0(root) gid=0(root) groups=0(root) context=u:r:magisk:s0
          </Term>
          <p>Si el comando devuelve <code className="mono">Permission denied</code>, abre la app Magisk → pestana <strong>Superusuario</strong> y activa el acceso para <code className="mono">[SharedUID] Shell</code> (queda desactivado por defecto la primera vez):</p>
          <div className="rm-shot-pair">
            <Shot src={superuserOff} alt="Pantalla Superusuario de Magisk con el acceso de Shell desactivado" caption="Asi aparece la primera vez — desactivado" />
            <Shot src={superuserOn} alt="Pantalla Superusuario de Magisk con el acceso de Shell activado" caption="Toca el interruptor para activarlo" />
          </div>
          <p>Vuelve a correr el comando. Si ves <code className="mono">uid=0(root)</code>, terminaste.</p>
        </section>

        <section className="rm-phase" id="resumen">
          <div className="rm-phase-head"><span className="rm-phase-num">07</span><div><h2>Resumen de trabas y soluciones</h2><p className="sub">Para cuando te topes con alguna a mitad de camino</p></div></div>
          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead><tr><th>Lo que ves</th><th>Por que pasa</th><th>Que hacer</th></tr></thead>
              <tbody>
                {TROUBLESHOOTING.map((row) => (
                  <tr key={row.p}><td className="p">{row.p}</td><td>{row.why}</td><td className="s">{row.s}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rm-phase" id="recursos" style={{ marginBottom: 20 }}>
          <div className="rm-phase-head"><span className="rm-phase-num">08</span><div><h2>Recursos usados, todos verificados</h2><p className="sub">Herramientas oficiales primero, comunitarias despues</p></div></div>
          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead><tr><th>Herramienta</th><th>Para que</th><th>Fuente</th></tr></thead>
              <tbody>
                {RECURSOS.map((r) => (
                  <tr key={r.tool}>
                    <td className="strong">{r.tool}</td>
                    <td>{r.use}</td>
                    <td>{r.href ? <a href={r.href} target="_blank" rel="noopener noreferrer">{r.label}</a> : <code className="mono">{r.label}</code>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rm-callout">
            <span className="tag">Sobre la herramienta comunitaria</span>
            <p>ZTE Family Toolbox no tiene firma digital de una empresa — es trabajo de la comunidad de modding. Descargala solo del hilo oficial de XDA, sube el archivo a VirusTotal antes de ejecutarla, y desconfia de cualquier version que no venga de esa fuente.</p>
          </div>
        </section>

        <section className="rm-phase" id="ayuda" style={{ marginBottom: 20 }}>
          <div className="rm-phase-head"><span className="rm-phase-num">09</span><div><h2>¿Te trabaste?</h2><p className="sub">Antes de escribirme, ten esto a mano</p></div></div>
          <p>Si te confundes en algun paso o no sabes como seguir, con gusto te ayudo directamente. Pero antes de contactarme, asegurate de tener <strong>todos los recursos de la seccion anterior ya descargados</strong> — con eso a la mano puedo ayudarte mucho mas rapido.</p>
          <div className="rm-help-row">
            <a className="rm-help-btn tiktok" href={socialLinks.tiktokMain} target="_blank" rel="noopener noreferrer">TikTok — @.mashesp</a>
            <a className="rm-help-btn discord" href={socialLinks.discord} target="_blank" rel="noopener noreferrer">Discord</a>
          </div>
          <p className="rm-help-note">Estoy activo en ambos — TikTok suele ser mas rapido, pero Discord es mejor si necesitas mandar capturas o logs largos.</p>
          <div className="rm-callout">
            <span className="tag">Si quieres que te ayude controlando tu PC a distancia</span>
            <p>Para eso uso <strong>RustDesk</strong> (gratis, open source). Antes de escribirme, descargalo e instalalo en tu PC desde <a href="https://rustdesk.com/" target="_blank" rel="noopener noreferrer">rustdesk.com</a> y dejalo abierto — te voy a pedir el ID y la contraseña de la ventana principal para conectarme. Nunca te voy a pedir que instales nada mas, ni que entres a otra pagina.</p>
          </div>
        </section>

        <div className="rm-footer-note">
          <span>Escrito a partir de un proceso real, documentado paso a paso por DaniVex. Compartelo si le ahorra dinero a alguien.</span>
          <code className="mono">NX789J · Snapdragon 8 Elite+ · Android 15</code>
        </div>

      </main>
    </>
  )
}

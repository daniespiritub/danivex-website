import { useState } from 'react'
import SiteNav from '../components/SiteNav.jsx'
import '../styles/redmagic-root.css'
import { socialLinks } from '../data/ecosystem.js'
import fastbootLocked from '../assets/redmagic-guide/fastboot-locked.webp'
import fastbootUnlocked from '../assets/redmagic-guide/fastboot-unlocked.webp'
import unlockWarning from '../assets/redmagic-guide/unlock-warning.webp'
import magiskAlldone from '../assets/redmagic-guide/magisk-alldone.webp'
import magiskSuperuser from '../assets/redmagic-guide/magisk-superuser.webp'
import powershellRoot from '../assets/redmagic-guide/powershell-root.webp'
import homeBooted from '../assets/redmagic-guide/home-booted.webp'
import toolboxSession from '../assets/redmagic-guide/toolbox-session.webp'
import toolboxOpening from '../assets/redmagic-guide/toolbox-opening.webp'
import toolboxMenu from '../assets/redmagic-guide/toolbox-menu.webp'
import toolboxModelSelect from '../assets/redmagic-guide/toolbox-model-select.webp'
import toolboxUnlockWarningText from '../assets/redmagic-guide/toolbox-unlock-warning-text.webp'
import toolboxAblFlash from '../assets/redmagic-guide/toolbox-abl-flash.webp'
import toolboxUnlockRun from '../assets/redmagic-guide/toolbox-unlock-run.webp'
import downloadsFolder from '../assets/redmagic-guide/downloads-folder.webp'
import firmwareCorruptError from '../assets/redmagic-guide/firmware-corrupt-error.webp'
import fps144Gameplay from '../assets/redmagic-guide/144fps-gameplay.webp'
import fps144Settings from '../assets/redmagic-guide/144fps-settings.webp'
import magiskInstalledHome from '../assets/redmagic-guide/magisk-installed-home.webp'
import fps144Module from '../assets/redmagic-guide/144fps-module.webp'

// Foto real con su etiqueta, para las capturas del proceso (no mockups).
function Shot({ src, alt, caption, wide }) {
  return (
    <figure className={`rm-shot${wide ? ' wide' : ''}`}>
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

// Tarjeta de sub-paso numerado (ej. "3.1"), para desglosar una fase en acciones
// chicas y concretas en vez de un bloque largo de texto.
function SubStep({ n, title, children, expect }) {
  return (
    <div className="rm-substep">
      <div className="rm-substep-head">
        <span className="rm-substep-num">{n}</span>
        <span className="rm-substep-title">{title}</span>
      </div>
      {children}
      {expect && <div className="rm-expect"><b>Deberías ver:</b><span>{expect}</span></div>}
    </div>
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
  { tool: 'Driver Qualcomm', use: 'Reconocer modo EDL/9008', href: 'https://github.com/qualcomm/qcom-usb-kernel-drivers/releases', label: 'github.com/qualcomm (oficial, firmado)' },
  { tool: 'payload-dumper-go', use: 'Extraer una sola particion del firmware', href: 'https://github.com/ssut/payload-dumper-go/releases', label: 'github.com/ssut (open source)' },
  { tool: 'Magisk', use: 'Parchear init_boot y dar root', href: 'https://github.com/topjohnwu/Magisk/releases', label: 'github.com/topjohnwu (oficial)' },
  { tool: 'Firmware viejo (11.0.16MR1_EA)', use: 'El abl vulnerable que downgradeamos en la Fase 04', href: 'https://rom.download.nubia.com/Europe/NX809J/REDMAGICOS11.0.16MR1_EA/update.zip', label: 'rom.download.nubia.com — ~9.3 GB, SHA1 verificado' },
  { tool: 'Firmware actual (11.0.19)', use: 'Respaldo del stock oficial, por si necesitas restaurar', href: 'https://rom.download.nubia.com/Europe/NX809J/REDMAGICOS11.0.19/update.zip', label: 'rom.download.nubia.com — ~9.3 GB' },
  { tool: 'ZTE Family Toolbox', use: 'Desbloqueo BL + flasheo por EDL', href: 'https://xdaforums.com/t/red-magic-11-pro-guide-bootloader-unlock-free-also-support-rm10-pad3pro-z70u-z80u-unlock-zte-family-toolbox.4780930/', label: 'hilo oficial en XDA Forums — comunitaria, revisa el hash antes de correrla' },
  { tool: 'Descarga directa del toolbox', use: 'Todas las versiones, para no andar buscandola', href: 'https://syxz.lanzoue.com/b01g0i33c', label: 'syxz.lanzoue.com — usa siempre la mas reciente arriba de todo, boton 普通下载' },
]

const TROUBLESHOOTING = [
  { p: '解锁失败 (desbloqueo fallido)', why: 'Firmware mas nuevo que 11.0.18, el exploit ya no aplica', s: 'Downgrade del abl (Fase 04)' },
  { p: 'PC no reconoce el modo 9008', why: 'Falta el driver Qualcomm', s: 'Instalar driver oficial de GitHub (Recursos)' },
  { p: 'fastboot: FAILED unknown command', why: 'El abl viejo tiene fastboot limitado', s: 'Flashear via EDL (toolbox, opcion 12) en vez de fastboot' },
  { p: 'No se ve el texto amarillo de advertencia', why: 'No es concluyente por si solo', s: 'Revisar DEVICE STATE en fastboot — ese si es 100% confiable' },
  { p: 'Archivo de firmware corrupto al extraer', why: 'Mirrors comunitarios no siempre estan completos', s: 'Usar el servidor oficial de Nubia (Recursos)' },
]

export default function RootRedMagic11Pro() {
  return (
    <>
      <SiteNav scanner skipTarget="main-content" />
      <main id="main-content" className="rm-main" data-companion-obstacle>

        <section className="rm-hero">
          <div className="rm-eyebrow-row">
            <span className="rm-eyebrow">Guia DaniVex · gratis</span>
            <span className="rm-eyebrow rm-eyebrow-alt">Sirve para toda la familia RedMagic</span>
          </div>
          <h1>Root a tu REDMAGIC<br /><em>sin pagar un centavo.</em></h1>
          <p className="lead">El RedMagic 11 Pro (NX809J) se puede desbloquear y rootear por tu cuenta. El unico &quot;secreto&quot; es que las herramientas estan en chino. Esto es exactamente lo que hicimos, con los tropiezos reales y como los resolvimos.</p>
          <div className="rm-stats">
            <div className="rm-stat"><b>$0</b><span>costo real</span></div>
            <div className="rm-stat"><b>~3h</b><span>tiempo estimado</span></div>
            <div className="rm-stat"><b>2</b><span>intentos fallidos, resueltos</span></div>
          </div>

          <figure className="rm-hero-shot">
            <img src={fastbootUnlocked} alt="Pantalla FastBoot Mode del REDMAGIC 11 Pro mostrando DEVICE STATE - unlocked" />
            <figcaption>Captura real del telefono — no es una recreacion.</figcaption>
          </figure>
        </section>

        <div className="rm-toc">
          <p>En esta guia</p>
          <ol>
            <li><a href="#requisitos">00 · Requisitos</a></li>
            <li><a href="#fase-1">01 · Preparar la PC</a></li>
            <li><a href="#fase-2">02 · Identificar y respaldar</a></li>
            <li><a href="#fase-3">03 · Primer intento</a></li>
            <li><a href="#fase-4">04 · La solucion real</a></li>
            <li><a href="#fase-5">05 · Desbloqueo exitoso</a></li>
            <li><a href="#fase-6">06 · Root con Magisk</a></li>
            <li><a href="#resultado">07 · Resultado real</a></li>
            <li><a href="#resumen">08 · Resumen de trabas</a></li>
            <li><a href="#recursos">09 · Recursos</a></li>
            <li><a href="#ayuda">10 · ¿Te trabaste?</a></li>
          </ol>
        </div>

        <section className="rm-phase" id="requisitos">
          <div className="rm-phase-head"><span className="rm-phase-num">00</span><div><h2>Antes de empezar</h2><p className="sub">Lo que necesitas, y lo que tienes que aceptar</p></div></div>
          <p>Esto funciona especificamente en el <strong>REDMAGIC 11 Pro (NX809J)</strong>, con Snapdragon 8 Elite Gen5. Otros modelos de la serie 11 usan el mismo metodo base, pero esta guia esta escrita con datos reales de ese dispositivo.</p>
          <ul>
            <li>PC con <strong>Windows 10/11 de 64 bits</strong>, PowerShell y unos <strong>15 GB libres</strong> (vamos a descargar firmware oficial).</li>
            <li>Cable USB en buen estado — nada de cargadores baratos sin datos.</li>
            <li>El telefono con bateria arriba del 50%.</li>
            <li>Paciencia: la primera vez toma 2-3 horas, principalmente por descargas.</li>
          </ul>
          <div className="rm-callout">
            <span className="tag">Leer esto primero</span>
            <p>Desbloquear el bootloader <strong>borra todos los datos del telefono</strong>. Hacemos un respaldo completo antes de tocar nada, pero es tu responsabilidad confirmarlo. Tambien se pierde la garantia oficial y puede fallar el lector de huellas (tiene arreglo, mas adelante). Nadie te puede garantizar cero riesgo — nosotros tampoco. Lo hacemos con cuidado, no a ciegas.</p>
          </div>
          <div className="rm-callout">
            <span className="tag">¿Sirve para otros RedMagic?</span>
            <p>El metodo en si (ZTE Family Toolbox + downgrade del <code className="mono">abl</code> si hace falta + Magisk) cubre a toda la familia — el toolbox trae mas de 30 modelos de RedMagic, Nubia y ZTE en su menu, no solo el 11 Pro. Lo que <strong>no</strong> se puede copiar entre modelos es la version exacta de firmware viejo (Fase 04): cada modelo tiene su propio umbral de version vulnerable y su propia URL de descarga. Si tienes otro RedMagic, sigue la guia igual, pero busca el firmware viejo <em>de tu modelo</em> en vez del NX809J.</p>
          </div>
        </section>

        <section className="rm-phase" id="fase-1">
          <div className="rm-phase-head"><span className="rm-phase-num">01</span><div><h2>Preparar la PC</h2><p className="sub">Las herramientas base, todas de fuentes oficiales</p></div></div>

          <div className="rm-substeps">
            <SubStep n="1.1" title="Descarga las herramientas base" expect="Android SDK Platform-Tools y el driver Qualcomm USB, listos en tu carpeta de Descargas.">
              <p>Instala <strong>Android SDK Platform-Tools</strong> (adb + fastboot) directo de Google, y el <strong>driver Qualcomm USB</strong> — este ultimo ahora lo publica el propio Qualcomm, firmado, en GitHub. Antes habia que buscarlo en mirrors dudosos; ya no. Los enlaces exactos estan en la seccion Recursos, al final de la guia.</p>
              <p>Activa tambien <strong>Depuracion USB</strong> en el telefono: Ajustes → Acerca del telefono → toca 7 veces &quot;Numero de compilacion&quot; → Opciones de desarrollador → Depuracion USB.</p>
            </SubStep>

            <SubStep n="1.2" title="Organiza todo en una sola carpeta" expect="Una carpeta C:\ZTE con el toolbox, el firmware y las herramientas, cada cosa en su lugar.">
              <p>A esta altura vas a tener varios archivos sueltos en Descargas — asi se veian los nuestros antes de mover nada:</p>
              <Shot src={downloadsFolder} alt="Carpeta de Descargas de Windows con Magisk, ZTE Family Toolbox, el driver Qualcomm y el firmware ya descargados" caption="Lo que necesitas, todo descargado — antes de organizarlo." />
              <p>Para no perderte despues, muevelos asi (la guia asume esta estructura en los comandos que siguen):</p>
              <div className="rm-table-wrap">
                <table className="rm-table">
                  <thead><tr><th>Archivo descargado</th><th>Va en</th></tr></thead>
                  <tbody>
                    <tr><td className="strong">platform-tools (zip)</td><td><code className="mono">C:\ZTE\Tools</code> — descomprimido ahi mismo</td></tr>
                    <tr><td className="strong">Driver Qualcomm USB</td><td><code className="mono">C:\ZTE\Tools</code></td></tr>
                    <tr><td className="strong">ZTE Family Toolbox (.7z)</td><td><code className="mono">C:\ZTE\Toolbox</code> — descomprimido ahi mismo</td></tr>
                    <tr><td className="strong">Firmware viejo (update.zip)</td><td><code className="mono">C:\ZTE\Firmware</code></td></tr>
                    <tr><td className="strong">Magisk (APK)</td><td><code className="mono">C:\ZTE\Magisk</code></td></tr>
                  </tbody>
                </table>
              </div>
              <p>Si prefieres no mover cada archivo a mano, hay un script que hace exactamente esta tabla por ti: crea las carpetas, busca cada archivo en Descargas/Escritorio por su nombre, lo copia a su lugar (nunca borra el original) y te abre las carpetas que vas a usar primero.</p>
              <Term label="PowerShell — PC" copy={'cd ~\\Downloads\\redmagic; .\\Organize-RedMagicDownloads.ps1'}>
                <span className="prompt-char">PS&gt;</span> <span className="cmd">.\Organize-RedMagicDownloads.ps1</span>{'\n'}[1] Creando C:\ZTE y sus subcarpetas{'\n'}  OK -&gt; C:\ZTE listo (Tools, Toolbox, Firmware, OldAbl, Magisk){'\n'}[2] Buscando cada herramienta{'\n'}  OK -&gt; ZTE Family Toolbox -&gt; ZTE Family Toolbox 1.2.1-beta3.7z{'\n'}[3] Copiando 4 archivo(s) a C:\ZTE{'\n'}[4] Abriendo las carpetas que vas a necesitar ahora
              </Term>
              <div className="rm-help-row" style={{ marginTop: 4 }}>
                <a className="rm-help-btn discord" href="/downloads/redmagic/Organize-RedMagicDownloads.ps1" download>Descargar Organize-RedMagicDownloads.ps1</a>
              </div>
              <div className="rm-callout">
                <span className="tag">Antes de correrlo</span>
                <p>Es un script de PowerShell comun y corriente — <strong>abrelo con el Bloc de notas y leelo</strong> antes de ejecutarlo, como harias con cualquier script que te bajas de internet. Solo copia archivos dentro de tu propio PC (de Descargas/Escritorio a <code className="mono">C:\ZTE</code>); no descarga nada, no toca el telefono ni escribe en ninguna particion.</p>
              </div>
            </SubStep>
          </div>
        </section>

        <section className="rm-phase" id="fase-2">
          <div className="rm-phase-head"><span className="rm-phase-num">02</span><div><h2>Identificar tu build y respaldar</h2><p className="sub">Esto decide si necesitas el paso 04 o no</p></div></div>
          <p>Con el telefono conectado:</p>
          <Term label="PowerShell — PC" copy="adb shell getprop ro.build.display.id">
            <span className="prompt-char">PS&gt;</span> <span className="cmd">adb shell getprop ro.build.display.id</span>{'\n'}REDMAGICOS11.5.8MR1_EA
          </Term>
          <p>Anota ese numero de build. Nosotros estabamos en <code className="mono">11.5.8MR1_EA</code>. Vas a necesitarlo en la Fase 3 para saber si tu telefono va a fallar el desbloqueo directo o no.</p>
          <p>Despues, haz respaldo completo — de tus archivos personales (<code className="mono">adb pull /sdcard/ respaldo/</code>) y, si tienes acceso a modo EDL (9008) via alguna toolbox, un respaldo de particiones completo. Esto no es opcional: es tu forma de volver atras si algo sale mal.</p>
        </section>

        <section className="rm-phase" id="fase-3">
          <div className="rm-phase-head"><span className="rm-phase-num">03</span><div><h2>El primer intento (y por que probablemente falle)</h2><p className="sub">Esto nos paso a nosotros — es la parte que nadie te explica</p></div></div>
          <p>La herramienta comunitaria para este modelo es <strong>ZTE Family Toolbox</strong> (ver seccion de Recursos, mas abajo, para el enlace). Vamos paso por paso con lo que vas a ver en pantalla:</p>

          <div className="rm-substeps">
            <SubStep n="3.1" title="Descomprime y abre el programa" expect="Una ventana negra con un logo hecho de texto (BFF) y un mensaje en chino.">
              <p>Descomprime el <code className="mono">.7z</code> que descargaste y haz doble clic en el archivo <code className="mono">中兴家族工具箱.bat</code> (el icono con engranaje azul). Se abre una consola negra.</p>
              <Shot src={toolboxOpening} alt="Ventana de inicio del ZTE Family Toolbox mostrando el logo BFF y un error de ruta con espacios" caption="Esto es lo primero que vas a ver al abrirlo." />
              <div className="rm-snagfix">
                <div className="line" />
                <div className="boxes">
                  <div className="rm-box snag"><span className="tag">Traba comun aqui mismo</span><p>Si la ventana se cierra sola o dice <code className="mono">工具箱路径中不允许有空格或英文括号</code> (&quot;la ruta no puede tener espacios&quot;), es porque la carpeta esta en una ruta con espacios — por ejemplo &quot;Mis Documentos&quot; o &quot;Nueva carpeta (2)&quot;.</p></div>
                  <div className="rm-box fix"><span className="tag">Solucion</span><p>Mueve toda la carpeta del toolbox a una ruta corta y sin espacios, por ejemplo <code className="mono">C:\ZTE\</code>, y abrelo de nuevo desde ahi.</p></div>
                </div>
              </div>
              <p>Una vez que abre bien, este es el menu principal con el que vas a trabajar durante toda la guia:</p>
              <Shot src={toolboxMenu} alt="Menu principal del ZTE Family Toolbox con todas las opciones numeradas en chino" caption="Menu principal real del ZTE Family Toolbox." />
            </SubStep>

            <SubStep n="3.2" title="Elige tu modelo de telefono" expect="Un menu numerado con varios modelos de RedMagic/Nubia. Escribe el numero del tuyo y presiona Enter.">
              <p>En el menu principal escribe <code className="mono">B</code> (opcion <code className="mono">选择机型</code> = elegir modelo) y presiona Enter. El programa pregunta que telefono tienes. Para el REDMAGIC 11 Pro (NX809J), busca la linea que diga <code className="mono">骁龙8E5 红魔11系列</code> (Snapdragon 8 Elite Gen5, serie RedMagic 11) — <strong>no</strong> elijas una que diga &quot;(不支持解锁)&quot; (no soporta desbloqueo), esas son para otros modelos.</p>
              <Shot src={toolboxModelSelect} alt="Lista de modelos del ZTE Family Toolbox mostrando la entrada 33, Snapdragon 8 Elite Gen5, serie RedMagic 11" caption="La entrada que buscas: [33] 骁龙8E5 红魔11系列." />
            </SubStep>

            <SubStep n="3.3" title="Ejecuta la opcion de desbloqueo" expect="Al final, un mensaje en rojo que dice 解锁失败 (desbloqueo fallido) — si tu build es reciente, esto es normal, sigue a la Fase 04.">
              <p>En el menu principal escribe <code className="mono">0</code> y presiona Enter (esa opcion dice <code className="mono">解锁BL</code> = Desbloquear Bootloader). Primero te muestra una advertencia real — leela, dice exactamente que arriesgas y que necesitas tener listo antes de seguir:</p>
              <Shot src={toolboxUnlockWarningText} alt="Advertencia real del ZTE Family Toolbox antes de desbloquear: perdida de garantia, formateo de datos, requisitos previos" caption="La advertencia completa, tal cual aparece — leela antes de presionar cualquier tecla." />
              <p>Confirma presionando cualquier tecla. Si tu build es reciente, termina asi:</p>
              <Term label="ZTE Family Toolbox">
                刷入解锁程序...{'\n'}设置自动恢复出厂...{'\n'}<span className="fail">解锁失败。请加交流群反馈。</span>
              </Term>
            </SubStep>
          </div>

          <div className="rm-snagfix">
            <div className="line" />
            <div className="boxes">
              <div className="rm-box snag"><span className="tag">La traba real (la del paso 3.3)</span><p>&quot;解锁失败&quot; = <strong>desbloqueo fallido</strong>. El exploit que usa la herramienta (llamado <code className="mono">efisp</code>) depende de un error en el bootloader que Nubia <strong>ya corrigio en firmwares posteriores a la version 11.0.18</strong>. Si tu build es mas nuevo que eso — y casi todos los telefonos vendidos hoy lo son — el ataque simplemente no tiene con que funcionar. No es que lo hagas mal: la vulnerabilidad ya no esta en tu bootloader actual.</p></div>
              <div className="rm-box fix"><span className="tag">La solucion</span><p>No hace falta reinstalar todo el sistema. Solo una particion pequenisima — el <code className="mono">abl</code> (menos de 300 KB) — necesita volver a una version vieja que si tenga el error. El resto del telefono se queda exactamente como esta. Fase 04.</p></div>
            </div>
          </div>
        </section>

        <section className="rm-phase" id="fase-4">
          <div className="rm-phase-head"><span className="rm-phase-num">04</span><div><h2>La solucion: downgrade quirurgico del ABL</h2><p className="sub">La parte que te ahorra el dinero que cobran los &quot;servicios&quot;</p></div></div>
          <p>Esto son 3 pasos chicos. No hace falta reinstalar todo el telefono — solo movemos una pieza minuscula (menos de 300 KB) a una version anterior que si tiene el error que el exploit necesita.</p>

          <div className="rm-substeps">
            <SubStep n="4.1" title="Descarga el firmware viejo, de la fuente oficial" expect="Un archivo update.zip de varios GB descargandose desde rom.download.nubia.com.">
              <p>Nubia no lo anuncia en su pagina, pero su servidor sigue sirviendo versiones antiguas si conoces la URL exacta. Para la region Europa/EEA, esta es la que usamos nosotros — <code className="mono">11.0.16MR1_EA</code>, cualquier version <strong>11.0.18 o anterior</strong> sirve igual:</p>
              <Term label="Descarga directa" copy="https://rom.download.nubia.com/Europe/NX809J/REDMAGICOS11.0.16MR1_EA/update.zip">
                <a href="https://rom.download.nubia.com/Europe/NX809J/REDMAGICOS11.0.16MR1_EA/update.zip" target="_blank" rel="noopener noreferrer">rom.download.nubia.com/Europe/NX809J/REDMAGICOS11.0.16MR1_EA/update.zip</a>
              </Term>
              <p className="rm-help-note" style={{ marginTop: -6 }}>~9.3 GB. Si tu telefono es de otra region (no Europa/EEA), cambia solo esa palabra en la URL — el resto de la ruta es igual.</p>
              <div className="rm-snagfix">
                <div className="line" />
                <div className="boxes">
                  <div className="rm-box snag"><span className="tag">Nos paso a nosotros</span><p>Un primer intento desde un mirror de comunidad nos dio esto al extraerlo:</p></div>
                  <div className="rm-box fix"><span className="tag">Solucion</span><p>Era un archivo subido incompleto en ese mirror — nada que ver con nuestra conexion. Cambiamos al servidor oficial de Nubia (<code className="mono">rom.download.nubia.com</code>) y se descargo completo, con el SHA1 verificado.</p></div>
                </div>
              </div>
              <Shot src={firmwareCorruptError} alt="Error real de 7-Zip: Unexpected end of archive, Open ERROR: Cannot open the file as 7z archive" caption="Esto es lo que ves si el archivo quedo incompleto — no es un error tuyo, es el mirror." wide />
            </SubStep>

            <SubStep n="4.2" title="Extrae solo la pieza que necesitas (abl.img)" expect="abl (242 kB) [=====...] 100% — una carpeta nueva con un archivo abl.img adentro.">
              <p>El firmware viene como un <code className="mono">update.zip</code> con un <code className="mono">payload.bin</code> adentro (formato estandar de Android). No hace falta descomprimir los varios GB enteros a mano: la herramienta <strong>payload-dumper-go</strong> saca una sola pieza en segundos.</p>
              <Term label="PowerShell — PC" copy={'payload-dumper-go.exe -p abl -o C:\\OldAbl payload.bin'}>
                <span className="prompt-char">PS&gt;</span> <span className="cmd">payload-dumper-go.exe -p abl -o C:\OldAbl payload.bin</span>{'\n'}abl (242 kB)  [=======================================] 100%
              </Term>
            </SubStep>

            <SubStep n="4.3" title="Flashea ese abl.img viejo, via modo 9008 (EDL)" expect="刷入完成 (flasheo completado) en la ventana del toolbox, dos veces (una por cada slot)">
              <p>Esto <strong>no</strong> se puede hacer con fastboot normal mientras el bootloader sigue bloqueado — por eso usamos EDL, un modo de bajisimo nivel del propio chip Qualcomm que no depende de Android ni de si el bootloader esta bloqueado.</p>
              <div className="rm-callout">
                <span className="tag">Primero, entra a modo EDL</span>
                <p>Con el telefono encendido y conectado: <code className="mono">adb reboot edl</code>. La pantalla se queda completamente negra — asi se ve EDL, sin interfaz. Si el PC no lo reconoce, instala el driver Qualcomm oficial (Fase 01) y revisa el Administrador de dispositivos: debe aparecer como &quot;Qualcomm HS-USB QDLoader 9008&quot;.</p>
              </div>
              <p>Ya en el menu principal del toolbox, escribe <code className="mono">12</code> y Enter (esa opcion dice <code className="mono">刷入任意分区</code> = flashear particion especifica). Cuando pida el nombre, escribe <code className="mono">abl_a</code> y selecciona tu <code className="mono">abl.img</code> viejo. Cuando termine, el programa vuelve a preguntar el nombre de particion — repite todo escribiendo <code className="mono">abl_b</code> esta vez (el telefono guarda dos copias, slot A y B, hay que reemplazar ambas).</p>
              <p>Esto es exactamente lo que vimos en nuestra pantalla — los dos flasheos, uno tras otro, cada uno terminando en <code className="mono">刷入完成</code>:</p>
              <Shot src={toolboxAblFlash} alt="ZTE Family Toolbox flasheando abl_a y luego abl_b desde C:\ZTE\OldAbl\abl.img, cada uno confirmando 刷入完成" caption="abl_a y abl_b, flasheados uno despues del otro — captura real, sin editar." />
              <p>El resto de la sesion completa — desde que el toolbox detecta el telefono hasta el final — se ve asi:</p>
              <Shot src={toolboxSession} alt="Ventana de ZTE Family Toolbox mostrando el procedimiento completo de desbloqueo en chino, con progreso en tiempo real" caption="Captura real de la herramienta, sin editar." />
            </SubStep>
          </div>
        </section>

        <section className="rm-phase" id="fase-5">
          <div className="rm-phase-head"><span className="rm-phase-num">05</span><div><h2>Reintentar el desbloqueo</h2><p className="sub">Ahora si deberia funcionar</p></div></div>

          <div className="rm-substeps">
            <SubStep n="5.1" title="Corre la Opcion 0 de nuevo" expect="El telefono se reinicia varias veces solo. No lo toques, no desconectes el cable.">
              <p>Con el <code className="mono">abl</code> viejo ya en el telefono (fin de la Fase 04), vuelve al menu principal de ZTE Family Toolbox y corre de nuevo la opcion <code className="mono">0. 解锁BL</code> — exactamente igual que en el Paso 3.3. Este proceso <strong>va a borrar todos los datos</strong> (ya tienes tu respaldo de la Fase 02).</p>
              <p>Esta vez el toolbox reconecta el telefono en modo 9008 solo, sin que falle — asi se ve en vivo:</p>
              <Shot src={toolboxUnlockRun} alt="ZTE Family Toolbox reconectando el telefono en modo 9008 para el segundo intento de desbloqueo" caption="El reintento, funcionando — reconexion 9008 en tiempo real." />
            </SubStep>

            <SubStep n="5.2" title="Confirma el resultado — no te quedes con la duda" expect="DEVICE STATE - unlocked (en rojo o verde, da igual el color, lo que importa es la palabra).">
              <p>La confirmacion real no es un mensaje bonito en la pantalla — es este campo exacto, visible al entrar en modo fastboot (<code className="mono">adb reboot bootloader</code>):</p>
              <div className="rm-shot-pair">
                <Shot src={fastbootLocked} alt="FastBoot Mode mostrando DEVICE STATE - locked, antes del proceso" caption="Antes: DEVICE STATE - locked" />
                <Shot src={fastbootUnlocked} alt="FastBoot Mode mostrando DEVICE STATE - unlocked, despues del proceso" caption="Despues: DEVICE STATE - unlocked" />
              </div>
              <p>Si dice <code className="mono">unlocked</code>, listo — bootloader desbloqueado de verdad, no supuesto. Durante el arranque tambien deberia aparecer un aviso de advertencia (normal, no es error):</p>
              <Shot src={unlockWarning} alt="Pantalla de advertencia: the boot loader is unlocked and software integrity cannot be guaranteed" caption="Aviso de bootloader desbloqueado al encender — normal y esperado." />
            </SubStep>
          </div>
        </section>

        <section className="rm-phase" id="fase-6">
          <div className="rm-phase-head"><span className="rm-phase-num">06</span><div><h2>Root con Magisk</h2><p className="sub">Con el bootloader ya desbloqueado, esta parte es estandar</p></div></div>
          <p>Tu REDMAGIC usa particion <code className="mono">init_boot</code> separada (tipico desde Android 13+), asi que se parchea esa, no el <code className="mono">boot.img</code> completo.</p>

          <div className="rm-substeps">
            <SubStep n="6.1" title="Parchea init_boot_a.img con Magisk" expect="All done! y un archivo nuevo en la carpeta Download del telefono.">
              <p>Saca <code className="mono">init_boot_a.img</code> del respaldo de particiones que hiciste en la Fase 02, pasalo al telefono, instala <strong>Magisk</strong> (APK oficial, ver Recursos), y desde la app: <em>Install → Select and Patch a File</em>, elige ese archivo.</p>
              <Shot src={magiskAlldone} alt="App Magisk mostrando Installing 30.7 y All done tras parchear init_boot_a.img, confirmando que Magisk quedo instalado" caption="Magisk 30.7 instalado y el parcheo terminado — queda guardado en Download." />
            </SubStep>

            <SubStep n="6.2" title="Flashea la imagen parcheada — por EDL, no por fastboot" expect="刷入完成 (flasheo completado), igual que en el Paso 4.3.">
              <div className="rm-snagfix">
                <div className="line" />
                <div className="boxes">
                  <div className="rm-box snag"><span className="tag">Traba comun aqui</span><p><code className="mono">fastboot flash init_boot_a imagen.img</code> puede fallar con <code className="mono">FAILED (remote: &apos;unknown command&apos;)</code>. El <code className="mono">abl</code> viejo que pusiste tiene un fastboot mas limitado que no soporta bien ese comando.</p></div>
                  <div className="rm-box fix"><span className="tag">La solucion</span><p>Flashea la imagen parcheada de Magisk <strong>por el mismo camino EDL</strong> que usaste para el abl (opcion 12 del toolbox, con el telefono en modo 9008). Hazlo en ambos slots: <code className="mono">init_boot_a</code> e <code className="mono">init_boot_b</code>.</p></div>
                </div>
              </div>
            </SubStep>

            <SubStep n="6.3" title="Reinicia normal y verifica" expect="uid=0(root) — eso confirma que el acceso root esta funcionando de verdad.">
              <Term label="PowerShell — PC" copy="adb shell su -c id">
                <span className="prompt-char">PS&gt;</span> <span className="cmd">adb shell su -c id</span>{'\n'}uid=0(root) gid=0(root) groups=0(root) context=u:r:magisk:s0
              </Term>
              <p>Acepta el dialogo de permiso que aparece en la pantalla del telefono la primera vez que corras este comando.</p>
              <Shot src={powershellRoot} alt="Terminal PowerShell mostrando la salida real uid=0(root) gid=0(root)" caption="Nuestra propia terminal, sin editar — asi se ve cuando funciona." wide />
              <div className="rm-shot-pair">
                <Shot src={magiskSuperuser} alt="App Magisk, pestana Superusuario, con Shell autorizado" caption="Permiso root concedido en Magisk" />
                <Shot src={homeBooted} alt="Pantalla de inicio del REDMAGIC ya rooteado, con apps instaladas" caption="El telefono, funcionando normal despues de todo" />
              </div>
            </SubStep>
          </div>
        </section>

        <section className="rm-phase" id="resultado">
          <div className="rm-phase-head"><span className="rm-phase-num">07</span><div><h2>Resultado real</h2><p className="sub">Esto es a lo que lleva hacer el root</p></div></div>
          <div className="rm-shot-pair">
            <Shot src={fps144Gameplay} alt="Free Fire corriendo a 144 FPS en un REDMAGIC 11 Pro rooteado, contador de FPS visible en pantalla" caption="144 FPS reales, en partida." />
            <Shot src={fps144Settings} alt="Ajustes de Free Fire mostrando la opcion 144 FPS disponible y seleccionada tras el root" caption="La opcion 144 FPS, disponible en Ajustes." />
          </div>
          <Shot src={magiskInstalledHome} alt="App Magisk, pantalla de inicio, mostrando Version instalada 30.7 (30700), Zygisk No, Ramdisk Si" caption="Magisk instalado — version 30.7." />
          <div className="rm-callout">
            <span className="tag">Sobre el modulo de 144 FPS</span>
            <p>Los 144 FPS reales en Free Fire no vienen del root solo — hace falta ademas un modulo de Magisk que ajusta como el telefono se identifica ante el juego. Ese modulo <strong>no es parte de esta guia</strong> y no lo vamos a explicar aqui — lo comparto yo personalmente, caso por caso, con la gente a la que ayudo. Si lo quieres, escribeme por TikTok o Discord (seccion de abajo).</p>
          </div>
          <Shot src={fps144Module} alt="Pantalla de Modulos de Magisk mostrando el perfil de 144 FPS instalado y activado" caption="Asi se ve instalado — lo paso aparte, directamente." wide />
        </section>

        <section className="rm-phase" id="resumen">
          <div className="rm-phase-head"><span className="rm-phase-num">08</span><div><h2>Resumen de trabas y soluciones</h2><p className="sub">Para cuando te topes con alguna a mitad de camino</p></div></div>
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
          <div className="rm-phase-head"><span className="rm-phase-num">09</span><div><h2>Recursos usados, todos verificados</h2><p className="sub">Herramientas oficiales primero, comunitarias despues</p></div></div>
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
            <p>ZTE Family Toolbox no tiene firma digital de una empresa — es trabajo de la comunidad de modding. Descargala solo del hilo oficial de XDA, sube el archivo a VirusTotal antes de ejecutarlo, y desconfia de cualquier version que no venga de esa fuente.</p>
          </div>
        </section>

        <section className="rm-phase" id="ayuda" style={{ marginBottom: 20 }}>
          <div className="rm-phase-head"><span className="rm-phase-num">10</span><div><h2>¿Te trabaste?</h2><p className="sub">Antes de escribirme, ten esto a mano</p></div></div>
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
          <code className="mono">NX809J · Snapdragon 8 Elite Gen5 · Android 16</code>
        </div>

      </main>
    </>
  )
}

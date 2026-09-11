// Catalogo historico de Pases de Free Fire (generado 2026-09-12).
// Elite Pass = P1..P55 (nombres de la base de items FF, id = 1001000000 + N).
// Booyah Pass = P56..P98 (sin nombre en la base; se etiquetan por numero).
// Imagen: Elite via CDN keyless por id; Booyah via imagenes publicas de pases.
// El catalogo es solo el HISTORICO; la POSESION por cuenta la aporta el provider.
const ELITE_NAMES = {"1":"Sakura","2":"Hip-hop","3":"Skull","4":"Royal","5":"Pirate's","6":"8-Bit","7":"Gear","8":"Mercenary","9":"Explosive","10":"Scarab","11":"Dragon","12":"Panther","13":"Horsemen","14":"Hunter","15":"Desert","16":"Eclipse","17":"Cowboy","18":"Hellsport","19":"Skull Pirate","20":"Clandestine","21":"T.R.A.P","22":"Nuked","23":"Agent Paws","24":"Forsaken Creed","25":"Fabled Foxes","26":"Rampage II: Uprising","27":"Sushi Menace","28":"Celestial Street","29":"Anubis Legend II","30":"Ultrasonic Rave","31":"Endless Oblivion","32":"Specter Squad","33":"Fuji Folklore","34":"Willful Wonders","35":"Bloodwing City","36":"Theatre of Torment","37":"Evil Enchanted","38":"Guns for Hire","39":"Wildland Walkers","40":"Quantic Unknown","41":"Mesmerizing Nights","42":"Inferno Rage","43":"Palace of Poker","44":"Planet Rogue","45":"Papyrus Rebel","46":"Copper Prodigies","47":"Scrolls of Azure","48":"Checkered Nobility","49":"Swordsoul Reality","50":"Bumble Rumblers","51":"The Kung-foodies","52":"Deep Sea Warriors","53":"Jutsu Elemental","54":"Voltage Vengeance","55":"Avalanche Abyss"}
export const PASS_MAX = 98
const ELITE_ICON_BASE = process.env.FF_ITEM_ICON_BASE || "https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG"
const BOOYAH_IMG_BASE = "https://www.freefiremania.com.br/images/passes-badges"
function passId(n){ return String(1001000000 + n) }
export function passImage(n) {
  const base = ELITE_ICON_BASE.replace(/\/$/, '')
  return n <= 55 ? `${base}/${passId(n)}.png` : `${BOOYAH_IMG_BASE}/${passId(n)}.png`
}
export function getPassCatalog(){ const out=[]; for(let n=1;n<=PASS_MAX;n++){ const system = n<=55 ? "elite-pass" : "booyah-pass"; const name = n<=55 ? (ELITE_NAMES[n]||("Pase de Elite "+n)) : ("Pase Booyah "+n); out.push({ num:n, id:passId(n), system, name, image:passImage(n) }); } return out }

/*
  Catalogo historico de Pases de Free Fire — DINAMICO (acepta cualquier P-numero,
  sin tope permanente). Numero GLOBAL de pase (Pxx) -> sistema + temporada + nombre.
   - P1..P55  = ELITE PASS  (systemSeason = N; nombres reales de la base de items FF).
   - P56..    = BOOYAH PASS (systemSeason = N-55; nombres por temporada de Booyah Pass).
  Mapeo verificado: P98 (Booyah S43) = "Baaast Friends" (badge lobo/oveja). El id de
  imagen es 1001000000+N. Imagen Elite via CDN keyless por id; Booyah via imagenes
  publicas de FreeFireMania. Si no hay nombre real conocido, se etiqueta por TEMPORADA
  (p.ej. "Pase Booyah S30"), nunca por el numero global crudo.
*/

const ELITE_NAMES = { 1: 'Sakura', 2: 'Hip-hop', 3: 'Skull', 4: 'Royal', 5: "Pirate's", 6: '8-Bit', 7: 'Gear', 8: 'Mercenary', 9: 'Explosive', 10: 'Scarab', 11: 'Dragon', 12: 'Panther', 13: 'Horsemen', 14: 'Hunter', 15: 'Desert', 16: 'Eclipse', 17: 'Cowboy', 18: 'Hellsport', 19: 'Skull Pirate', 20: 'Clandestine', 21: 'T.R.A.P', 22: 'Nuked', 23: 'Agent Paws', 24: 'Forsaken Creed', 25: 'Fabled Foxes', 26: 'Rampage II: Uprising', 27: 'Sushi Menace', 28: 'Celestial Street', 29: 'Anubis Legend II', 30: 'Ultrasonic Rave', 31: 'Endless Oblivion', 32: 'Specter Squad', 33: 'Fuji Folklore', 34: 'Willful Wonders', 35: 'Bloodwing City', 36: 'Theatre of Torment', 37: 'Evil Enchanted', 38: 'Guns for Hire', 39: 'Wildland Walkers', 40: 'Quantic Unknown', 41: 'Mesmerizing Nights', 42: 'Inferno Rage', 43: 'Palace of Poker', 44: 'Planet Rogue', 45: 'Papyrus Rebel', 46: 'Copper Prodigies', 47: 'Scrolls of Azure', 48: 'Checkered Nobility', 49: 'Swordsoul Reality', 50: 'Bumble Rumblers', 51: 'The Kung-foodies', 52: 'Deep Sea Warriors', 53: 'Jutsu Elemental', 54: 'Voltage Vengeance', 55: 'Avalanche Abyss' }

// Nombres de temporada de BOOYAH PASS (systemSeason). Verificados con fuentes
// publicas. Las temporadas sin nombre confirmado se etiquetan "Pase Booyah S{n}".
const BOOYAH_NAMES = {
  1: 'Fumes on Fire', 2: 'Fatal Fauna', 3: 'The Biotroopers', 4: 'Wave Watchers',
  5: 'Neon Drifterz', 6: 'Comic Chaos', 7: 'T.R.A.P. City', 8: 'Synthetic Strike',
  9: 'Jelly Assault', 10: 'Fishing Frenzy', 11: 'Rise of the Puppets', 12: 'Frostfire',
  13: 'Electri City', 14: 'Rage Reverie', 15: 'Tales of Pond', 16: 'Lustrous Nightfall',
  17: 'Pixel Reality', 18: "Twilight's End", 19: 'Lucky Goosy', 20: 'Majestic Roar',
  21: 'Ocean Outlaws', 22: 'Last Laugh', 23: 'Ding Ding', 24: 'Giddy Runaway',
  25: 'Mad Stitcher', 26: 'Wrapped and Ready', 27: 'Inkredible Duo', 28: 'Moonlit Venture',
  29: 'NOODLICIOUS',
  // S30..S41: nombres oficiales PT-BR verificados (Garena Brasil).
  30: 'Nascidos das Chamas', 31: 'Ao Vivaço', 32: 'Domínio das Chamas',
  33: 'Eclipse do Deserto', 34: 'Clima Nebuloso', 35: 'Hora Fantasmagórica',
  36: 'Guerreiros Estelares', 37: 'Era uma Vez', 38: 'Maré Celestial',
  39: 'Jornada Dourada', 40: 'Febre de Emoji', 41: 'Sonho Lapidado',
  42: 'Interstellar', 43: 'Baaast Friends', 44: 'An Apple a Day', 45: 'Stellar Spica',
}

// Tope solo para getPassCatalog() (listado/tests). El pipeline usa passEntry(n)
// dinamicamente para cualquier N que aparezca en el album (P99, P100, ...).
export const PASS_MAX = 98

const ELITE_ICON_BASE = process.env.FF_ITEM_ICON_BASE || 'https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG'
const BOOYAH_IMG_BASE = 'https://www.freefiremania.com.br/images/passes-badges'

function passId(n) {
  return String(1001000000 + n)
}

export function passImage(n) {
  const base = ELITE_ICON_BASE.replace(/\/$/, '')
  return n <= 55 ? `${base}/${passId(n)}.png` : `${BOOYAH_IMG_BASE}/${passId(n)}.png`
}

// Entrada de catalogo para CUALQUIER numero global de pase (dinamico).
export function passEntry(n) {
  const num = Number(n)
  const isElite = num <= 55
  const system = isElite ? 'elite-pass' : 'booyah-pass'
  const systemSeason = isElite ? num : num - 55
  const known = isElite ? ELITE_NAMES[num] : BOOYAH_NAMES[systemSeason]
  const name = known || (isElite ? `Pase de Élite S${systemSeason}` : `Pase Booyah S${systemSeason}`)
  return { num, id: passId(num), system, systemSeason, name, image: passImage(num) }
}

// Catalogo P1..PASS_MAX (para listados/tests). El ownership real llega aparte.
export function getPassCatalog() {
  const out = []
  for (let n = 1; n <= PASS_MAX; n += 1) out.push(passEntry(n))
  return out
}

export const socialLinks = {
  discord: 'https://discord.gg/AmTUUANzRr',
  whatsapp: 'https://whatsapp.com/channel/0029Vb7ChEo2UPBIcPCSTI0m',
  instagram: 'https://www.instagram.com/dani.bpe/',
  tiktokMain: 'https://www.tiktok.com/@.mashesp',
  tiktokSecond: 'https://www.tiktok.com/@.danibpe',
}

// Only published product facts live here; optional future release fields may
// include size, publishedAt, sha256, requirements and changelogUrl.
export const mobilador = {
  id: 'mobilador', name: 'DaniVex Mobilador', version: '0.0.0.1',
  platform: 'Windows', architecture: '64 bits',
  downloadUrl: 'https://github.com/daniespiritub/danivex-mobilador/releases/download/v0.0.0.1/DaniVex-Mobilador-Setup.exe',
  releaseUrl: 'https://github.com/daniespiritub/danivex-mobilador/releases/tag/v0.0.0.1',
}

export const tools = [
  { id: 'sensitivity', href: '#sensibilidad', platform: 'Android / iOS / Tablet', icon: 'tune',
    name: { es: 'Sensibilidad FF', pt: 'Sensibilidade FF', en: 'FF Sensitivity' },
    description: { es: 'Una base para tu dispositivo y tu forma de jugar.', pt: 'Uma base para seu aparelho e seu jeito de jogar.', en: 'A starting point for your device and the way you play.' } },
  { id: 'scanner', href: '/player-scanner', platform: 'Free Fire', icon: 'scan',
    name: { es: 'Player Scanner', pt: 'Player Scanner', en: 'Player Scanner' },
    description: { es: 'Explora el perfil público de un jugador por UID.', pt: 'Explore o perfil público de um jogador pelo UID.', en: 'Explore a player’s public profile by UID.' } },
  { ...mobilador, href: '#mobilador', icon: 'desktop',
    name: { es: mobilador.name, pt: mobilador.name, en: mobilador.name },
    description: { es: 'Tu Android, conectado a tu PC.', pt: 'Seu Android, conectado ao seu PC.', en: 'Your Android, connected to your PC.' } },
]

export const platformCopy = {
  es: { purpose: 'Herramientas para gamers.', hero: 'Ajusta tu sensibilidad. Explora jugadores. Lleva tu Android al PC. Todo en DaniVex.',
    tools: 'Elige tu próxima herramienta', toolsText: 'Del primer ajuste a la próxima partida.', open: 'Abrir herramienta',
    mobileToPc: 'Del móvil a tu PC.', mobiladorText: 'Refleja y controla tu Android desde Windows con DaniVex Mobilador.',
    screenTabs: ['Inicio', 'Perfiles', 'Acerca de'], version: 'Versión', release: 'Ver versión en GitHub',
    downloadTitle: 'Llévate DaniVex contigo.', communityTitle: 'Se juega mejor en comunidad.',
    communityText: 'Comparte tu configuración, encuentra a tu equipo y entérate de las novedades de DaniVex.',
    connect: 'Síguenos', menu: 'Abrir navegación', closeMenu: 'Cerrar navegación', skip: 'Ir al contenido',
    home: 'Inicio', liveResult: 'Ajustes en tiempo real', language: 'Idioma', catalogError: 'No se pudo cargar el catálogo. Puedes seguir con los modelos disponibles o elegir una gama.',
    details: 'Por qué estos valores', copyError: 'No se pudo copiar. Puedes seleccionar los valores del resultado.',
  },
  pt: { purpose: 'Ferramentas para gamers.', hero: 'Ajuste sua sensibilidade. Explore jogadores. Leve seu Android ao PC. Tudo na DaniVex.',
    tools: 'Escolha sua próxima ferramenta', toolsText: 'Do primeiro ajuste à próxima partida.', open: 'Abrir ferramenta',
    mobileToPc: 'Do celular ao seu PC.', mobiladorText: 'Espelhe e controle seu Android no Windows com DaniVex Mobilador.',
    screenTabs: ['Início', 'Perfis', 'Sobre'], version: 'Versão', release: 'Ver versão no GitHub',
    downloadTitle: 'Leve DaniVex com você.', communityTitle: 'Jogar em comunidade é melhor.',
    communityText: 'Compartilhe suas configurações, encontre sua equipe e acompanhe as novidades da DaniVex.',
    connect: 'Siga a DaniVex', menu: 'Abrir navegação', closeMenu: 'Fechar navegação', skip: 'Ir ao conteúdo',
    home: 'Início', liveResult: 'Ajustes em tempo real', language: 'Idioma', catalogError: 'Não foi possível carregar o catálogo. Use os modelos disponíveis ou escolha uma categoria.',
    details: 'Por que estes valores', copyError: 'Não foi possível copiar. Você pode selecionar os valores do resultado.',
  },
  en: { purpose: 'Tools for gamers.', hero: 'Tune your sensitivity. Explore players. Bring your Android to PC. All in DaniVex.',
    tools: 'Choose your next tool', toolsText: 'From the first adjustment to the next match.', open: 'Open tool',
    mobileToPc: 'From your phone to your PC.', mobiladorText: 'Mirror and control your Android from Windows with DaniVex Mobilador.',
    screenTabs: ['Home', 'Profiles', 'About'], version: 'Version', release: 'View release on GitHub',
    downloadTitle: 'Take DaniVex with you.', communityTitle: 'Better with your community.',
    communityText: 'Share your setup, find your team and catch up with what’s new at DaniVex.',
    connect: 'Follow DaniVex', menu: 'Open navigation', closeMenu: 'Close navigation', skip: 'Skip to content',
    home: 'Home', liveResult: 'Live adjustments', language: 'Language', catalogError: 'The catalog could not load. Use an available device or choose a tier.',
    details: 'Why these values', copyError: 'Could not copy. You can select the result values instead.',
  },
}

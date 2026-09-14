export const initialCompanionState = { action: 'WAITING', base: 'IDLE', busy: false, revision: 0, started: false }

const sectionActions = {
  inicio: 'IDLE', sensibilidad: 'LOOK', scanner: 'POINT_LEFT', herramientas: 'POINT_RIGHT',
  mobilador: 'CURIOUS', descargas: 'POINT_LEFT', comunidad: 'WAVE', contacto: 'WAVE', footer: 'WAVE',
}

export const actionDuration = {
  INTRO: 650, WAVE: 2200, LOOK: 2000, CURIOUS: 1800, HAPPY: 1800,
  CELEBRATE: 2300, BORED: 3600, SLEEPY: 5000, MOVE_SIDE: 700,
  SURPRISED: 1400, RETURN: 1600, POINT_LEFT: 2000, POINT_RIGHT: 2000,
}

export function companionReducer(state, event) {
  if (!state.started && !['SECTION', 'READY'].includes(event.type)) return state
  const next = (action, extra = {}) => ({ ...state, ...extra, action, revision: state.revision + 1 })
  switch (event.type) {
    case 'READY': return state.started ? state : next('INTRO', { started: true })
    case 'SECTION': {
      const base = sectionActions[event.section] || 'IDLE'
      if (state.base === base) return state
      return state.busy || !state.started ? { ...state, base } : next(base, { base })
    }
    case 'LOADING': return next('THINKING', { busy: true })
    case 'SUCCESS': return next('CELEBRATE', { busy: false })
    case 'ERROR': return next('CURIOUS', { busy: false })
    case 'CHANGE': return state.busy ? state : next('CURIOUS')
    case 'TAP': return state.busy ? state : next(['WAVE', 'HAPPY', 'SURPRISED'][event.index % 3])
    case 'MANY_TAPS': return state.busy ? state : next('SURPRISED')
    case 'INACTIVE': return state.busy ? state : next(event.sleepy ? 'SLEEPY' : 'BORED')
    case 'ACTIVITY': return ['BORED', 'SLEEPY'].includes(state.action) ? next('RETURN') : state
    case 'MOVE': return state.busy || state.action === 'INTRO' ? state : next('MOVE_SIDE')
    case 'FINISH':
      if (event.revision !== state.revision || state.busy) return state
      return next(state.action === 'INTRO' ? 'WAVE' : 'IDLE')
    default: return state
  }
}

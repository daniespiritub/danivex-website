// Point modelUrl at a rigged GLB to replace the temporary articulated character.
export const companionAsset = {
  modelUrl: null,
  height: 3.75,
  rotationY: 0,
  clips: {
    INTRO: ['Intro', 'Idle'], WAVE: ['Wave', 'Greeting'], IDLE: ['Idle', 'Breathing'],
    LOOK: ['Look', 'Idle'], CURIOUS: ['Curious', 'Look'], THINKING: ['Thinking', 'Idle'],
    HAPPY: ['Happy', 'ThumbsUp'], CELEBRATE: ['Celebrate', 'Happy'],
    WAITING: ['Waiting', 'Idle'], BORED: ['Bored', 'Idle'], SLEEPY: ['Sleepy', 'Idle'],
    MOVE_SIDE: ['Walk', 'Move'], SURPRISED: ['Surprised', 'Wave'], RETURN: ['Wave', 'Idle'],
    POINT_LEFT: ['PointLeft', 'Look'], POINT_RIGHT: ['PointRight', 'Look'],
  },
}

export const COMPANION_EVENT = 'danivex:companion'

export function reactCompanion(type) {
  window.dispatchEvent(new CustomEvent(COMPANION_EVENT, { detail: { type } }))
}

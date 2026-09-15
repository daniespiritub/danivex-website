// Independently replaceable licensed character; no procedural fallback.
export const companionAsset = {
  modelUrl: '/companion/DaniVexCharacter.glb',
  height: 3.7,
  rotationY: -.08,
  clips: {
    INTRO: ['Intro', 'Idle'], WAVE: ['Wave', 'Greeting'], IDLE: ['Idle', 'Breathing'],
    LOOK: ['Look', 'Idle'], CURIOUS: ['Curious', 'Look'], THINKING: ['Thinking', 'Idle'],
    HAPPY: ['Happy', 'ThumbsUp'], CELEBRATE: ['Celebrate', 'Happy'],
    WAITING: ['Waiting', 'Idle'], BORED: ['Bored', 'Idle'], SLEEPY: ['Sleepy', 'Idle'],
    MOVE_SIDE: ['Walk', 'Move'], HOP: ['Hop'], SURPRISED: ['Surprised', 'Wave'], RETURN: ['Return', 'Idle'],
    POINT_LEFT: ['PointLeft', 'Look'], POINT_RIGHT: ['PointRight', 'Look'],
  },
}

export const COMPANION_EVENT = 'danivex:companion'

export function reactCompanion(type) {
  window.dispatchEvent(new CustomEvent(COMPANION_EVENT, { detail: { type } }))
}

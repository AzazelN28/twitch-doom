export const JoystickAxis = {
  POSITIVE: -256,
  NEGATIVE: 256,
  SUPER_POSITIVE: -1024,
  SUPER_NEGATIVE: 1024
}

export const JoystickButton = {
  A: Math.pow(2, 0),
  B: Math.pow(2, 1),
  X: Math.pow(2, 2),
  Y: Math.pow(2, 3),
  START: Math.pow(2, 4),
  BACK: Math.pow(2, 5)
}

export const EventType = {
  KEY_DOWN: 0,
  KEY_UP: 1,
  MOUSE: 2,
  JOYSTICK: 3,
  QUIT: 4
}

const MAX_EVENTS = process.env.TWITCH_DOOM_MAX_EVENTS
  ? parseInt(process.env.TWITCH_DOOM_MAX_EVENTS, 10)
  : 60

const events = []

export function deque() {
  return events.shift()
}

export function queue(...args) {
  return events.push(...args)
}

export function create(type, ...data) {
  const payload = new Int32Array(6)
  payload.set([type, ...data], 0)
  return payload
}

export function createAndQueue(type, ...data) {
  return queue(create(type, ...data))
}

export default {
  JoystickAxis,
  JoystickButton,
  EventType,
  get isFull() {
    return events.length >= MAX_EVENTS
  },
  get isNotEmpty() {
    return events.length > 0
  },
  get isEmpty() {
    return events.length === 0
  },
  deque,
  queue,
  create,
  createAndQueue
}

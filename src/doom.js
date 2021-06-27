import cp from 'child_process'
import events, { EventType, JoystickAxis, JoystickButton } from './doom/events'
import loop from './doom/loop'

export const Weapon = {
  FIST: 0,
  PISTOL: 1,
  SHOTGUN: 2,
  CHAINGUN: 3,
  ROCKET: 4,
  PLASMA: 5,
  BFG: 6
}

export function start() {
  const doom = cp.spawn('./bin/doom', ['-iwad', './bin/doom1.wad'], {
    stdio: process.env.TWITCH_DOOM_DEBUG_STDIO ? 'inherit' : null
  })
  return doom
}

export function init() {
  return loop.start()
}

export function reset() {
  events.createAndQueue(EventType.KEY_UP, 0x80 + 0x41)
  events.createAndQueue(EventType.KEY_UP, 0x79)
}

export function forward(amount) {
  return events.createAndQueue(EventType.JOYSTICK,0,0,JoystickAxis.POSITIVE,0,0)
}

export function backward(amount) {
  return events.createAndQueue(EventType.JOYSTICK,0,0,JoystickAxis.NEGATIVE,0,0)
}

export function turnLeft(amount) {
  return events.createAndQueue(EventType.JOYSTICK,0,JoystickAxis.POSITIVE,0,0)
}

export function turnRight(amount) {
  return events.createAndQueue(EventType.JOYSTICK,0,JoystickAxis.NEGATIVE,0,0)
}

export function strafeLeft(amount) {
  return events.createAndQueue(EventType.JOYSTICK,0,0,0,JoystickAxis.POSITIVE,0)
}

export function strafeRight(amount) {
  return events.createAndQueue(EventType.JOYSTICK,0,0,0,JoystickAxis.NEGATIVE,0)
}

export function shoot() {
  return events.createAndQueue(EventType.JOYSTICK,JoystickButton.A)
}

export function use() {
  return events.createAndQueue(EventType.JOYSTICK,JoystickButton.B)
}

export function automap() {
  return events.createAndQueue(EventType.KEY_UP, 0x09)
}

export function weapon(id) {
  return events.createAndQueue(EventType.KEY_UP, 0x31 + id)
}

export function cheat(text) {
  // TBI: To Be Implemented
  return null
}

export default {
  get isFull() {
    return events.isFull
  },
  Weapon,
  start,
  init,
  forward,
  backward,
  turnLeft,
  turnRight,
  strafeLeft,
  strafeRight,
  shoot,
  use,
  automap,
  weapon,
  cheat
}

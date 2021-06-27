import events from './events'
import client from './client'
import debug from 'debug'

const log = debug('twitchdoom:loop')

const { EventType } = events

const LOOP_INTERVAL = process.env.TWITCH_DOOM_LOOP_INTERVAL
  ? parseInt(process.env.TWITCH_DOOM_LOOP_INTERVAL)
  : 1000 / 15

let isRunning = false
let timeout
let shouldReset = false
let lastMessage = 0

function loop() {
  if (events.isNotEmpty) {
    shouldReset = false
    client.send(events.deque())
  } else {
    if (!shouldReset) {
      log('Should reset')
      shouldReset = true
      lastMessage = Date.now()
    } else {
      // ¿5 minutos sin interacción?
      if (Date.now() - lastMessage >= 5 * 60 * 1000) {
        log('Resetting')
        client.send(events.create(EventType.KEY_UP, 0x80 + 0x41))
        client.send(events.create(EventType.KEY_UP, 0x79))
        return
      }
    }
    client.send(events.create(EventType.JOYSTICK))
  }
  timeout = setTimeout(loop, LOOP_INTERVAL)
}

export function start() {
  if (isRunning) {
    return false
  }
  isRunning = true
  timeout = setTimeout(loop, LOOP_INTERVAL)
  return true
}

export function stop() {
  if (!isRunning) {
    return false
  }
  isRunning = false
  if (timeout) {
    clearTimeout(timeout)
    timeout = undefined
  }
  return true
}

export default {
  start,
  stop
}

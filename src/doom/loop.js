import events from './events'
import client from './client'
import debug from 'debug'

const log = debug('twitchdoom:loop')

const { EventType } = events

const LOOP_INTERVAL = process.env.TWITCH_DOOM_LOOP_INTERVAL
  ? parseInt(process.env.TWITCH_DOOM_LOOP_INTERVAL)
  : 1000 / 4

let isRunning = false
let timeout = null
let shouldReset = false
let lastMessage = 0
const autoReset = process.env.TWITCH_DOOM_AUTO_RESET
  ? parseInt(process.env.TWITCH_DOOM_AUTO_RESET, 10)
  : 0 

/**
 * Main communication loop.
 *
 * This loop is called with the specified frequency by `process.env.TWITCH_DOOM_LOOP_INTERVAL` (by default
 * every 250ms). In this loop an event from the event queue is dequeued and sent to TwitchDOOM through the
 * UDP client (by default, port 13666). 
 */
function loop() {
  if (events.isNotEmpty) {
    shouldReset = false
    client.send(events.deque())
  } else {
    if (autoReset) {
      if (!shouldReset) {
        log('Should reset')
        shouldReset = true
        lastMessage = Date.now()
      } else {
        // ¿5 minutos sin interacción?
        if (Date.now() - lastMessage >= autoReset * 60 * 1000) {
          log('Resetting')
          client.send(events.create(EventType.KEY_DOWN, 0x80 + 0x41))
          client.send(events.create(EventType.KEY_UP, 0x80 + 0x41))
          client.send(events.create(EventType.KEY_DOWN, 0x79))
          client.send(events.create(EventType.KEY_UP, 0x79))
          // Esto es seguramente lo que estaba haciendo que se bloquease el proceso.
          shouldReset = false
          lastMessage = Date.now()
          return
        }
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

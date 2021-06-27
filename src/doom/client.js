import dgram from 'dgram'

const client = dgram.createSocket('udp4')

export function send(event) {
  if (event.length !== 6 && !(event instanceof Int32Array)) {
    throw new TypeError('Invalid DOOM event type')
  }
  return client.send(
    event,
    process.env.TWITCH_DOOM_PORT || 13666,
    process.env.TWITCH_DOOM_HOST || '127.0.0.1'
  )
}

export default {
  send
}

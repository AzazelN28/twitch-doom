import tmi from 'tmi.js'
import debug from 'debug'

const log = debug('twitchdoom:twitch')

export function connect(options) {
  log('Creating Twitch Client')
  const client = new tmi.client(options)
  log('Connecting')
  client.connect()
  return client
}

export default {
  connect
}

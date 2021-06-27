import debug from 'debug'
import doom from './doom'
import watcher from './watcher'
import { notify } from './notify/slack'

const log = debug('twitchdoom')

export default function main() {
  const client = twitch.connect({
    identity: {
      username: process.env.TWITCH_CHATBOT_USERNAME,
      password: process.env.TWITCH_CHATBOT_OAUTH_TOKEN
    },
    channels: [process.env.TWITCH_CHANNEL_NAME]
  })

  client.on('message', (channel, tags, msg, self) => {
    // Ignoramos los mensajes del bot.
    if (self || !msg.startsWith('!')) {
      return
    }

    // Si la cola está llena, pasamos.
    if (doom.isFull) {
      return client.say(
        channel,
        `@${tags.username} event pool is full, wait please`
      )
    }

    const commandName = msg.trim()
    const commandList = [
      '!h', '!help',
      '!f', '!forward',
      '!b', '!backward',
      '!l', '!tl', '!turnleft',
      '!r', '!tr', '!turnright',
      '!sl', '!strafeleft',
      '!sr', '!straferight',
      '!s', '!shoot', '!fire',
      '!u', '!use',
      '!a', '!m', '!map', '!automap',
      '!1', '!fist',
      '!2', '!pistol',
      '!3', '!shotgun',
      '!4', '!chaingun',
      '!5', '!rocket',
      '!6', '!plasma',
      '!7', '!bfg',
      '!iddqd',
      '!idkfa'
    ]

    if (commandList.includes(commandName)) {
      // log('Executing', commandName)
      // client.say(channel, `@${tags.username} running command ${commandName.substr(1)}`)
      // data1: Bitfield of buttons currently pressed.
      // data2: X axis mouse movement (turn).
      // data3: Y axis mouse movement (forward/backward).
      // data4: Third axis mouse movement (strafe).
      // data5: Fourth axis mouse movement (look)
      switch (commandName) {
        case '!h': case '!help': return client.say(channel, `@${tags.username} to play you can use:`)
        case '!f': case '!forward': return doom.forward()
        case '!b': case '!backward': return doom.backward()
        case '!l': case '!tl': case '!turnleft': return doom.turnLeft()
        case '!r': case '!tr': case '!turnright': return doom.turnRight()
        case '!sl': case '!strafeleft': return doom.strafeLeft()
        case '!sr': case '!straferight': return doom.strafeRight()
        case '!s': case '!shoot': case '!fire': return doom.shoot()
        case '!u': case '!use': return doom.use()
        case '!a': case '!m': case '!map': case '!automap': return doom.automap()
        case '!1': case '!fist': return doom.weapon(doom.Weapon.FIST)
        case '!2': case '!pistol': return doom.weapon(doom.Weapon.PISTOL)
        case '!3': case '!shotgun': return doom.weapon(doom.Weapon.SHOTGUN)
        case '!4': case '!chaingun': return doom.weapon(doom.Weapon.CHAINGUN)
        case '!5': case '!rocket': return doom.weapon(doom.Weapon.ROCKET)
        case '!6': case '!plasma': return doom.weapon(doom.Weapon.PLASMA)
        case '!7': case '!bfg': return doom.weapon(doom.Weapon.BFG)
        case '!iddqd':
        case '!idkfa':
          client.say(channel, `@${tags.username} nice try. ;)`)
          break
      }
    } else {
      // TODO: Podemos intentar parsear cosas como !f25
    }
  })

  client.on('connected', async (addr, port) => {
    log(`Connected to ${addr}:${port}`)
    log('Starting DOOM')
    watcher.watch(doom.start())
    log('Waiting for DOOM')
    await time.waitFor()
    log('Retrieving X window info')
    const { x, y, width, height } = await xwininfo.getInfo()
    log('Starting GStreamer pipeline')
    watcher.watch(gstreamer.start({ x: x + 1, y: y + 29, width, height }))
    log('Initializing DOOM input loop')
    doom.init()
  })

  client.on('error', (error) => {
    log('Error', error)
    notify({ text: `Twitch Client error ${error.message}` })
  })

}

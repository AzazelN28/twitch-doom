import debug from 'debug'
import doom from './doom'
import watcher from './watcher'
import twitch from './twitch'
import time from './time'
import xwininfo from './xwininfo'
import gstreamer from './gstreamer'
import { notify } from './notify/slack'

const log = debug('twitchdoom')

/**
 * Main
 */
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

    const commandName = msg.trim().toLowerCase()
    const commandList = [
      '!h', '!help',
      '!f', '!forward', '!up',
      '!b', '!backward', '!down', '!dn',
      '!l', '!tl', '!left', '!turnleft',
      '!r', '!tr', '!right', '!turnright',
      '!sl', '!strafeleft',
      '!sr', '!straferight',
      '!s', '!shoot', '!shot', '!fire',
      '!u', '!use', '!o', '!open',
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
        case '!h': case '!help': return client.say(channel, `@${tags.username} to move you can use !forward, !backward, !turnleft, !turnright, !strafeleft, !straferight or its shortcut version: !f, !b, !l, !r, !sl, !sr, to shoot use !shoot (or !s or !fire) and to use !use (also !u, !o or !open). You can change weapon with numbers !1,!2,!3,!4,!5,!6,!7 or by its name: !fist, !pistol, !shotgun, !chaingun, !rocket, !plasma or !bfg. You can also chain commands like: !f f f sl s (you can use commas, semicolons, dots, etc as separator), or by using amounts like !s5 to shoot five times. When you die, you can use !u, !o, !use or !open to restart the game.`)
        case '!f': case '!forward': case '!up': return doom.forward()
        case '!b': case '!backward': case '!down': case '!dn': return doom.backward()
        case '!l': case '!tl': case '!left': case '!turnleft': return doom.turnLeft()
        case '!r': case '!tr': case '!right': case '!turnright': return doom.turnRight()
        case '!sl': case '!strafeleft': return doom.strafeLeft()
        case '!sr': case '!straferight': return doom.strafeRight()
        case '!s': case '!shoot': case '!fire': return doom.shoot()
        case '!u': case '!use': case '!o': case '!open': return doom.use()
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
      log('Unrecognized command')
      if (commandName.length > 1) {
        log('Parsing complex command names')
        const actions = commandName.substr(1).split(/[+\-.,;:> ]+/g).map((part) => {
          const matches = part.match(/(f(?:orward)?|b(?:ackward)?|l(?:eft)?|r(?:ight)?|t(?:urn)?(?:l(?:eft)?|r(?:ight)?)|s(?:trafe)?(?:l(?:eft)?|r(?:ight)?)|s(?:hoot)?|u(?:se)?|o(?:pen)?)([1-9]{1})?/)
          if (matches) {
            const [, action, amountAsString] = matches
            return [action, parseInt(amountAsString || '1', 10)]
          }
        }).filter((part) => part).slice(0, 5)
        log('Actions', actions)
        for (const [action, amount] of actions) {
          log('Action', action, amount)
          switch (action) {
            case 'f': case 'forward': doom.forward(amount); break
            case 'b': case 'backward': doom.backward(amount); break
            case 'l': case 'tl': case 'turnl': case 'tleft': case 'turnleft': doom.turnLeft(amount); break
            case 'r': case 'tr': case 'turnr': case 'tright': case 'turnright': doom.turnRight(amount); break
            case 'sl': case 'strafeleft': case 'sleft': case 'strafel': doom.strafeLeft(amount); break
            case 'sr': case 'straferight': case 'sright': case 'strafer': doom.strafeRight(amount); break
            case 's': case 'shoot': doom.shoot(amount); break
            case 'u': case 'use': case 'o': case 'open': doom.use(amount); break
            default: 
              log('Unknown', action, amount)
              return
          }   
        }
      }
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
    watcher.watch(gstreamer.start({ 
      x: x + 2, 
      y: y + 29, 
      width, 
      height,
      location: `rtmp://mad.contribute.live-video.net/app/${process.env.TWITCH_STREAM_KEY}`
    }))
    log('Initializing DOOM input loop')
    doom.init()
  })

  client.on('error', (error) => {
    log('Error', error)
    notify({ text: `Twitch Client error ${error.message}` })
  })

}

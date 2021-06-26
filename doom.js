const tmi = require('tmi.js')
const cp = require('child_process')
const dgram = require('dgram')
const debug = require('debug')
const dotenv = require('dotenv')
dotenv.config()

const log = debug('log')
const error = debug('error')

// Define configuration options
const opts = {
  identity: {
    username: process.env.TWITCH_CHATBOT_USERNAME,
    password: process.env.TWITCH_CHATBOT_OAUTH_TOKEN
  },
  channels: [
    process.env.TWITCH_CHANNEL_NAME
  ]
}

const DoomJoystickAxis = {
  POSITIVE: -256,
  NEGATIVE: 256
}

const DoomJoystickButton = {
  A: Math.pow(2, 0),
  B: Math.pow(2, 1),
  X: Math.pow(2, 2),
  Y: Math.pow(2, 3),
  START: Math.pow(2, 4),
  BACK: Math.pow(2, 5)
}

const DoomEventType = {
  KEY_DOWN: 0,
  KEY_UP: 1,
  MOUSE: 2,
  JOYSTICK: 3,
  QUIT: 4
}

/*

//
// DOOM keyboard definition.
// This is the stuff configured by Setup.Exe.
// Most key data are simple ascii (uppercased).
//
#define KEY_RIGHTARROW	0xae
#define KEY_LEFTARROW	0xac
#define KEY_UPARROW	0xad
#define KEY_DOWNARROW	0xaf
#define KEY_ESCAPE	27
#define KEY_ENTER	13
#define KEY_TAB		9
#define KEY_F1		(0x80+0x3b)
#define KEY_F2		(0x80+0x3c)
#define KEY_F3		(0x80+0x3d)
#define KEY_F4		(0x80+0x3e)
#define KEY_F5		(0x80+0x3f)
#define KEY_F6		(0x80+0x40)
#define KEY_F7		(0x80+0x41)
#define KEY_F8		(0x80+0x42)
#define KEY_F9		(0x80+0x43)
#define KEY_F10		(0x80+0x44)
#define KEY_F11		(0x80+0x57)
#define KEY_F12		(0x80+0x58)

#define KEY_BACKSPACE	0x7f
#define KEY_PAUSE	0xff

#define KEY_EQUALS	0x3d
#define KEY_MINUS	0x2d

#define KEY_RSHIFT	(0x80+0x36)
#define KEY_RCTRL	(0x80+0x1d)
#define KEY_RALT	(0x80+0x38)

#define KEY_LALT	KEY_RALT

// new keys:

#define KEY_CAPSLOCK    (0x80+0x3a)
#define KEY_NUMLOCK     (0x80+0x45)
#define KEY_SCRLCK      (0x80+0x46)
#define KEY_PRTSCR      (0x80+0x59)

#define KEY_HOME        (0x80+0x47)
#define KEY_END         (0x80+0x4f)
#define KEY_PGUP        (0x80+0x49)
#define KEY_PGDN        (0x80+0x51)
#define KEY_INS         (0x80+0x52)
#define KEY_DEL         (0x80+0x53)

#define KEYP_0          KEY_INS
#define KEYP_1          KEY_END
#define KEYP_2          KEY_DOWNARROW
#define KEYP_3          KEY_PGDN
#define KEYP_4          KEY_LEFTARROW
#define KEYP_5          (0x80+0x4c)
#define KEYP_6          KEY_RIGHTARROW
#define KEYP_7          KEY_HOME
#define KEYP_8          KEY_UPARROW
#define KEYP_9          KEY_PGUP

#define KEYP_DIVIDE     '/'
#define KEYP_PLUS       '+'
#define KEYP_MINUS      '-'
#define KEYP_MULTIPLY   '*'
#define KEYP_PERIOD     0
#define KEYP_EQUALS     KEY_EQUALS
#define KEYP_ENTER      KEY_ENTER

#define SCANCODE_TO_KEYS_ARRAY {                                            \
    0,   0,   0,   0,   'a',                                  // 0-9 //     \
    'b', 'c', 'd', 'e', 'f',                                                \
    'g', 'h', 'i', 'j', 'k',                                  // 10-19 //   \
    'l', 'm', 'n', 'o', 'p',                                                \
    'q', 'r', 's', 't', 'u',                                  // 20-29 //   \
    'v', 'w', 'x', 'y', 'z',                                                \
    '1', '2', '3', '4', '5',                                  // 30-39 //   \
    '6', '7', '8', '9', '0',                                                \
    KEY_ENTER, KEY_ESCAPE, KEY_BACKSPACE, KEY_TAB, ' ',       // 40-49 //   \
    KEY_MINUS, KEY_EQUALS, '[', ']', '\\',                                  \
    0,   ';', '\'', '`', ',',                                 // 50-59 //   \
    '.', '/', KEY_CAPSLOCK, KEY_F1, KEY_F2,                                 \
    KEY_F3, KEY_F4, KEY_F5, KEY_F6, KEY_F7,                   // 60-69 //   \
    KEY_F8, KEY_F9, KEY_F10, KEY_F11, KEY_F12,                              \
    KEY_PRTSCR, KEY_SCRLCK, KEY_PAUSE, KEY_INS, KEY_HOME,     // 70-79 //   \
    KEY_PGUP, KEY_DEL, KEY_END, KEY_PGDN, KEY_RIGHTARROW,                   \
    KEY_LEFTARROW, KEY_DOWNARROW, KEY_UPARROW,                // 80-89 //   \
    KEY_NUMLOCK, KEYP_DIVIDE,                                               \
    KEYP_MULTIPLY, KEYP_MINUS, KEYP_PLUS, KEYP_ENTER, KEYP_1,               \
    KEYP_2, KEYP_3, KEYP_4, KEYP_5, KEYP_6,                   // 90-99 //   \
    KEYP_7, KEYP_8, KEYP_9, KEYP_0, KEYP_PERIOD,                            \
    0, 0, 0, KEYP_EQUALS,                                     // 100-103 // \
}

// Input event types.
typedef enum
{
    // Key press/release events.
    //    data1: Key code (from doomkeys.h) of the key that was
    //           pressed or released. This is the key as it appears
    //           on a US keyboard layout, and does not change with
    //           layout.
    // For ev_keydown only:
    //    data2: ASCII representation of the key that was pressed that
    //           changes with the keyboard layout; eg. if 'Z' is
    //           pressed on a German keyboard, data1='y',data2='z'.
    //           Not affected by modifier keys.
    //    data3: ASCII input, fully modified according to keyboard
    //           layout and any modifier keys that are held down.
    //           Only set if I_StartTextInput() has been called.
    ev_keydown,
    ev_keyup,

    // Mouse movement event.
    //    data1: Bitfield of buttons currently held down.
    //           (bit 0 = left; bit 1 = right; bit 2 = middle).
    //    data2: X axis mouse movement (turn).
    //    data3: Y axis mouse movement (forward/backward).
    ev_mouse,

    // Joystick state.
    //    data1: Bitfield of buttons currently pressed.
    //    data2: X axis mouse movement (turn).
    //    data3: Y axis mouse movement (forward/backward).
    //    data4: Third axis mouse movement (strafe).
    //    data5: Fourth axis mouse movement (look)
    ev_joystick,

    // Quit event. Triggered when the user clicks the "close" button
    // to terminate the application.
    ev_quit
} evtype_t;
*/
const doomEvents = []
const doomClient = dgram.createSocket('udp4')

// Create a client with our options
const twitchClient = new tmi.client(opts)

// Register our event handlers (defined below)
twitchClient.on('message', onMessageHandler)
twitchClient.on('connected', onConnectedHandler)
// twitchClient.on('error', onErrorHandler)

// Conectamos con Twitch
twitchClient.connect();

// Llamado cada vez que llega un mensaje al chat.
function onMessageHandler (channel, tags, msg, self) {
  //log(self, msg)
  // Ignoramos los mensajes del bot.
  if (self || !msg.startsWith('!')) {
    return
  }

  if (doomEvents.length > 60) {
    twitchClient.say(channel, `@${tags.username} event pool is full, wait please`)
    return
  }

  //log(channel, tags, msg, self)
  const commandName = msg.trim();
  const commandList = [
    '!forward',
    '!backward',
    '!turnleft',
    '!turnright',
    '!strafeleft',
    '!straferight',
    '!shoot',
    '!fire',
    '!use',
    '!start',
    '!stop',
    '!f',
    '!b',
    '!l',
    '!r',
    '!sl',
    '!sr',
    '!u',
    '!s'
  ]
  if (commandList.includes(commandName)) {
    // log('Executing', commandName)
    // twitchClient.say(channel, `@${tags.username} running command ${commandName.substr(1)}`)
    // data1: Bitfield of buttons currently pressed.
    // data2: X axis mouse movement (turn).
    // data3: Y axis mouse movement (forward/backward).
    // data4: Third axis mouse movement (strafe).
    // data5: Fourth axis mouse movement (look)
    switch (commandName) {
      case '!f': case '!forward': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,0,DoomJoystickAxis.POSITIVE,0,0])); break;
      case '!b': case '!backward': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,0,DoomJoystickAxis.NEGATIVE,0,0])); break;
      case '!l': case '!turnleft': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,DoomJoystickAxis.POSITIVE,0,0,0])); break;
      case '!r': case '!turnright': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,DoomJoystickAxis.NEGATIVE,0,0,0])); break;
      case '!sl': case '!strafeleft': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,0,0,DoomJoystickAxis.POSITIVE,0])); break;
      case '!sr': case '!straferight': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,0,0,DoomJoystickAxis.NEGATIVE,0])); break;
      case '!s': case '!shoot': case '!fire': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,DoomJoystickButton.A,0,0,0,0])); break;
      case '!u': case '!use': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,DoomJoystickButton.B,0,0,0,0])); break;
      case '!stop': doomEvents.push(new Int32Array([DoomEventType.JOYSTICK,0,0,0,0,0])); break;
    }
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  log(`Connected to ${addr}:${port}`);

  setInterval(() => {
    if (doomEvents.length > 0) {
      const doomEvent = doomEvents.shift()
      doomClient.send(doomEvent, process.env.TWITCH_DOOM_PORT, process.env.TWITCH_DOOM_HOST)
    } else {
      doomClient.send(new Int32Array([DoomEventType.JOYSTICK,0,0,0,0,0]), process.env.TWITCH_DOOM_PORT, process.env.TWITCH_DOOM_HOST)
    }
  }, 1000 / 15)

  const doom = cp.spawn('./bin/doom', ['-iwad', './bin/doom1.wad'], {
    stdio: process.env.TWITCH_DOOM_DEBUG_STDIO ? 'inherit' : null
  })

  doom.on('close', (code, signal) => {
    console.log('DOOM Closed', code, signal)
  })

  // Necesitamos esperar a que el DOOM esté listo, así que esperamos un poquito
  // y continuamos.
  setTimeout(() => {

    // Obtenemos la información de la ventana del DOOM.
    cp.exec('xwininfo -name "DOOM Shareware - Chocolate Doom 3.0.0"', (err, stdout, stderr) => {
      log(stdout)
      const matches = stdout.match(/-geometry\s+(?<width>[0-9]+)x(?<height>[0-9]+)[-+](?<x>[0-9]+)[-+](?<y>[0-9]+)/)
      log(matches)
      if (!matches) {
	doom.kill('SIGINT')
        log('Killing DOOM')
        return process.exit(1)
      }

      const width = parseInt(matches.groups.width, 10)
      const height = parseInt(matches.groups.height, 10)
      const x = parseInt(matches.groups.x, 10) + 1
      const y = parseInt(matches.groups.y, 10) + 29
      const location = `rtmp://mad.contribute.live-video.net/app/${process.env.TWITCH_STREAM_KEY}`

      const gstreamerPipeline = `flvmux
        name=mux
        streamable=true
        metadatacreator="Twitch DOOM"
        ! queue
        ! rtmpsink location=${location}
        ximagesrc
          startx=${x}
          starty=${y}
          endx=${x+width}
          endy=${y+height}
          use-damage=0
        ! queue
        ! videoconvert n-threads=2
        ! queue
        ! videoscale n-threads=2
        ! queue
        ! videorate
        ! video/x-raw,width=1280,height=720,framerate=30/1,pixel-aspect-ratio=1/1
        ! queue
        ! x264enc
            bitrate=3000
            key-int-max=60
            speed-preset=1
            tune=zerolatency
        ! video/x-h264,profile=main
        ! mux.
        pulsesrc device="alsa_output.platform-bcm2835_audio.digital-stereo.monitor"
        ! queue
        ! audioconvert
        ! queue
        ! voaacenc
        ! queue
        ! mux.
        `.split(/\s+/g)

      log('Gstreamer', 'gst-launch-1.0', '-v', ...gstreamerPipeline)
      const gstreamer = cp.spawn('gst-launch-1.0', [
        '-v', ...gstreamerPipeline
      ], {
        stdio: process.env.TWITCH_DOOM_DEBUG_STDIO ? 'inherit' : null
      })

      gstreamer.on('close', (code, signal) => {
	log('GStreamer closed', code, signal)
      })

    })

  }, 1000)

}

import cp from 'child_process'
import debug from 'debug'

const log = debug('twitchdoom:gstreamer')

export function start({ x, y, width, height, location }) {
  const gstreamerPipeline = `flvmux
    name=mux
    streamable=true
    metadatacreator="Twitch DOOM"
    ! queue
    ! rtmpsink location=${location}
    ximagesrc
      startx=${x}
      starty=${y}
      endx=${x + width}
      endy=${y + height}
      use-damage=0
    ! queue
    ! videoconvert n-threads=2
    ! queue
    ! videoscale n-threads=2
    ! queue
    ! videorate
    ! video/x-raw,width=848,height=480,framerate=30/1,pixel-aspect-ratio=1/1
    ! queue
    ! x264enc
        bitrate=1600
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
  const gstreamer = cp.spawn('gst-launch-1.0', ['-v', ...gstreamerPipeline], {
    stdio: process.env.TWITCH_DOOM_DEBUG_STDIO ? 'inherit' : null
  })

  gstreamer.on('close', async (code, signal) => {
    log('GStreamer closed', code, signal)
    await notify({ text: 'GStreamer unexpectedly closed' })
  })

  return gstreamer
}

export default {
  start
}

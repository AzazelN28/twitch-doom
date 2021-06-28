import cp from 'child_process'
import debug from 'debug'

const log = debug('twitchdoom:gstreamer')

/**
 * GStreamer options
 *
 * TODO: Maybe in the future we can specify more options like x264enc options: bitrate, speed-preset, etc.
 *
 * @typedef {Object} GStreamerOptions
 * @property {number} x X coordinate
 * @property {number} y Y coordinate
 * @property {number} width Width
 * @property {number} height Height
 * @property {string} location RTMP location
 */

/**
 * Starts GStreamer live streaming using ximagesrc coordinates and
 * RTMP location.
 * @param {GStreamerOptions} options
 * @returns {ChildProcess}
 */
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
        speed-preset=3
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

  // Be careful, this can leak stream keys.
  // log('Gstreamer', 'gst-launch-1.0', '-v', ...gstreamerPipeline)

  const gstreamer = cp.spawn('gst-launch-1.0', ['-v', ...gstreamerPipeline], {
    stdio: process.env.TWITCH_DOOM_DEBUG_STDIO ? 'inherit' : null
  })

  return gstreamer
}

export default {
  start
}

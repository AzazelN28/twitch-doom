import debug from 'debug'

const log = debug('twitchdoom:xwininfo')

export function getInfo(name = 'DOOM Shareware - Chocolate Doom 3.0.0') {
  return new Promise((resolve, reject) => {
    log('Executing xwininfo')
    cp.exec(`xwininfo -name "${name}"`, async (err, stdout) => {
      if (err) {
        log('Error', err)
        return reject(err)
      }

      const matches = stdout.match(
        /-geometry\s+(?<width>[0-9]+)x(?<height>[0-9]+)[-+](?<x>[0-9]+)[-+](?<y>[0-9]+)/
      )
      if (!matches) {
        log("Can't parse stdout")
        return reject(new Error("Can't parse stdout"))
      }

      const width = parseInt(matches.groups.width, 10)
      const height = parseInt(matches.groups.height, 10)
      const x = parseInt(matches.groups.x, 10)
      const y = parseInt(matches.groups.y, 10)
      log('Geometry', x, y, width, height)
      return resolve({
        x,
        y,
        width,
        height
      })
    })
  })
}

export default {
  getInfo
}

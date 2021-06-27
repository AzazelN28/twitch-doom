import { notify } from './notify/slack'
import debug from 'debug'

const log = debug('twitchdoom:watcher')

const children = []

export function watch(child) {
  children.push(child)
  child.on('close', (code, signal) => {
    if (child.killed) {
      return
    }

    notify({ text: `Process ${child.spawnfile} ${child.spawnargs.join(' ')} unexpectedly closed with code ${code} ${signal}` })

    // Matamos el resto de procesos
    children.forEach((child) => {
      try {
        child.kill('SIGINT')
      } catch (error) {
        log(error)
      }
    })

    // Esto es un poco ñapa.
    // Esperamos a que todos los procesos se hayan muerto
    // correctamente para no tener procesos Zombie.
    setTimeout(() => process.exit(1), 1000)

  })
}

export default {
  watch
}

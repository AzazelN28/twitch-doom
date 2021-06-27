/**
 * Waits for an specified amount of milliseconds (by default 1000ms)
 * @param {number} [time=1000] Time in ms
 * @returns {Promise}
 */
export function waitFor(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time)
  })
}

export default {
  waitFor
}

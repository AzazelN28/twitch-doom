export function waitFor(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time)
  })
}

export default {
  waitFor
}

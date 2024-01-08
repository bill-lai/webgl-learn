import { startAnimation } from "."

export const bindKeyboard = (
  mount: HTMLElement, 
  shortcutKeys: string, 
  animation: (keys: string[], diffMis: number) => void,
) => {
  const keys: string[] = []

  let stopAnimation: null | (() => void) = null
  const keyAnimation = () => {
    let then = Date.now()
    const stop = startAnimation(() => {
      const now = Date.now();
      const mis = (now - then) * 0.001
      then = now;
      animation(keys, mis)
    })
    stopAnimation = () => {
      stop()
      stopAnimation = null
    }
  }

  mount.addEventListener('keyup', ev => {
    if (!shortcutKeys.includes(ev.key)) return;
    let index: number
    if (~(index = keys.indexOf(ev.key))) {
      keys.splice(index, 1)
    }
    if (stopAnimation && keys.length === 0) {
      stopAnimation()
    }
  })

  mount.addEventListener('keydown', ev => {
    if (!shortcutKeys.includes(ev.key)) return;
    if (!keys.includes(ev.key)) {
      keys.push(ev.key)
    }
    stopAnimation || keyAnimation()
  })
}
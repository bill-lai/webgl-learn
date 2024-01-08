export * from './gl'
export * from './math-2d'
export * from './math-3d'
export * from './mt4'
export * from './resource'
export * from './scene-graph'
export * from './shaperes'
export * from './gl-attrib'
export * from './gl-object'
export * from './bind-mouse'
export * from './parse-obj'
export * from './text-texture'
export * from './bind-keyboard'
export * from './bind-fps-camera'


export const frameRender = (render: (now: number) => void) => {
  let currentPromise: Promise<void> | null = null;
  const startRender = () => {
    currentPromise = new Promise<void>(resolve => {
      requestAnimationFrame(now => {
        try {
          render(now);
        } catch (e) {
          console.error(e)
        }
        resolve()
        currentPromise = null
      })
    })
  }
  return () => {
    if (!currentPromise) {
      startRender()
    }
    return currentPromise!;
  }
}

export const startAnimation = (fn: (now: number) => void) => {
  let stop = false
  const run = (now: number) =>  {
    if (stop) return;
    fn(now);
    requestAnimationFrame(run)
  }
  run(0)
  return () => stop = true
}
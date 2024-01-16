import { loadImage, startAnimation } from "../../util"
import { upDown, mix } from './'
import imageURI from './v38pV.jpeg'



export const init = async (canvas: HTMLCanvasElement) => {
  const image = await loadImage(imageURI)
  const ctx = canvas.getContext('2d')!

  const hTemp = new Array(canvas.height).fill(0)
  let hMaps: [number, number][] = hTemp.map((_, ndx) => [ndx, ndx])

  const redraw = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    hMaps.forEach(([srcY, dstY]) => {
      ctx.drawImage(image, 0, srcY, image.width, 1, 0, dstY, canvas.width, 1);
    })
  }

  startAnimation((t) => {
    const t1 = t * 0.001
    const t2 = t1 * 0.37

    hMaps = hTemp.map((_, ndx) => {
      const v = ndx / canvas.height
      const offset1 = Math.sin((v + 0.5) * mix(3, 12, upDown(t1))) * 300
      const offset2 = Math.sin((v + 0.5) * mix(3, 12, upDown(t2))) * 300

      let srcY = ndx * image.height / canvas.height + offset2 + offset1
      srcY = Math.max(0, Math.min(srcY, image.height - 1))
      return [srcY, ndx]
    })
    redraw()
  })
}
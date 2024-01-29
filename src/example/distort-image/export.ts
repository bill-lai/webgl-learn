
export { init } from './'
import cover from './cover.png'
import v38pV from './v38pV.jpeg'
import code1 from './fragment-shader.frag?raw'
import code2 from './vertex-shader.vert?raw'
import code3 from './webgl.ts?raw'
import { ExampleMeta } from '@/status/example'

export const meta: ExampleMeta = {
  name: '图片像素动画',
  cover,
  material: [
    { type: 'code', content: code1, name: 'fragment-shader.vert' },
    { type: 'code', content: code2, name: 'vertex-shader.frag' },
    { type: 'code', content: code3, name: 'index.ts' },
    { type: 'img', content: v38pV, name: 'v38pV.jpeg' }
  ]
}
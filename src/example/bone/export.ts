
export { init } from './'
import cover from './cover.png'
import code1 from './fragment-shader.frag?raw'
import code2 from './vertex-tex-shader.vert?raw'
import code3 from './index.ts?raw'
import { ExampleMeta } from '@/status/example'

export const meta: ExampleMeta = {
  name: '骨骼动画',
  cover,
  material: [
    { type: 'code', content: code1, name: 'fragment-shader.vert' },
    { type: 'code', content: code2, name: 'vertex-tex-shader.frag' },
    { type: 'code', content: code3, name: 'index.ts' }
  ]
}
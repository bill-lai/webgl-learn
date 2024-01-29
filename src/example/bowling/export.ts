
export { init } from './'
import cover from './cover.png'
import code1 from './fragment-light-shader.frag?raw'
import code2 from './vertex-light-shader.vert?raw'
import code3 from './index.ts?raw'
import tex from '/texure/uv-grid.png'
import { ExampleMeta } from '@/status/example'

export const meta: ExampleMeta = {
  name: '贝塞尔曲线构建模型',
  cover,
  material: [
    { type: 'code', content: code1, name: 'fragment-light-shader.vert' },
    { type: 'code', content: code2, name: 'vertex-tex-shader.frag' },
    { type: 'code', content: code3, name: 'index.ts' },
    { type: 'img', content: tex, name: 'texure/uv-grid.png' }
  ]
}
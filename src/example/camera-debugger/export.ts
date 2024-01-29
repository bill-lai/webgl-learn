
export { init } from './'
import cover from './cover.png'
import code1 from './fragment-shader.frag?raw'
import code2 from './vertex-shader.vert?raw'
import code3 from '@/util/cameraDebugger.ts?raw'
import code4 from './index.ts?raw'
import { ExampleMeta } from '@/status/example'

export const meta: ExampleMeta = {
  name: '相机调试',
  cover,
  type: 'static',
  material: [
    { type: 'code', content: code1, name: 'fragment-light-shader.vert' },
    { type: 'code', content: code2, name: 'vertex-tex-shader.frag' },
    { type: 'code', content: code3, name: 'cameraDebugger.ts' },
    { type: 'code', content: code4, name: 'index.ts' }
  ]
}
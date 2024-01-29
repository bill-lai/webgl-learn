
export { init } from './'
import cover from './cover.png'
import code1 from './fragment-shader.frag?raw'
import code2 from './vertex-shader.vert?raw'
import code3 from './index.ts?raw'
import { ExampleMeta } from '@/status/example'

const images = [
  "/leaves.jpg",
  "/star.jpg",
  "/texure/f-texture.png",
  "/texure/keyboard.jpg",
];

export const meta: ExampleMeta = {
  name: '图片像素动画',
  cover,
  material: [
    { type: 'code', content: code1, name: 'fragment-shader.vert' },
    { type: 'code', content: code2, name: 'vertex-shader.frag' },
    { type: 'code', content: code3, name: 'index.ts' },
    ...images.map(item => ({ type: 'img' as 'img', content: item, name: item }))
  ]
}
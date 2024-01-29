
export { init } from './link'
import cover from './cover.png'
import code1 from "./fragment-3d-shader.frag?raw";
import code2 from "./vertex-3d-shader.vert?raw";
import code3 from "./fragment-tex-shader.frag?raw";
import code4 from "./vertex-tex-shader.vert?raw";
import setting from './setting.json?raw'
import fontInfo from './font.json?raw'
import code5 from './link.ts?raw'
import { ExampleMeta } from '@/status/example'
import code6 from '@/util/text-texture.ts?raw'

const images = [
  "/texure/8x8-font.png",
];

export const meta: ExampleMeta = {
  name: '图片像素动画',
  cover,
  material: [
    { type: 'code', content: code1, name: 'vertex-3d-shader.vert' },
    { type: 'code', content: code2, name: 'fragment-3d-shader.frag' },
    { type: 'code', content: code3, name: 'vertex-tex-shader.vert' },
    { type: 'code', content: code4, name: 'fragment-tex-shader.frag' },
    { type: 'code', content: code6, name: 'text-texture.ts' },
    { type: 'code', content: code5, name: 'index.ts' },
    { type: 'code', content: setting, name: 'setting.json' },
    { type: 'code', content: fontInfo, name: 'font.json' },
    ...images.map(item => ({ type: 'img' as 'img', content: item, name: item }))
  ]
}
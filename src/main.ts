import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { router } from './route'
import hljs from 'highlight.js';
import './style.css'
import 'highlight.js/styles/xcode.css'
import jsLib from 'highlight.js/lib/languages/javascript'
import tsLib from 'highlight.js/lib/languages/typescript'
import glslLib from 'highlight.js/lib/languages/glsl'

hljs.registerLanguage('javascript', jsLib)
hljs.registerLanguage('typescript', tsLib)
hljs.registerLanguage('typescript', glslLib)


const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')

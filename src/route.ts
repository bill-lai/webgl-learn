import { createRouter, createWebHashHistory } from "vue-router";
import Examples from '@/views/list/items.vue'
import Deteil from '@/views/deteil/index.vue'
import Draw from '@/views/draw/index.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      name: 'draw',
      path: "/",
      component: Draw,
    },
    {
      name: 'examples',
      path: "/examples",
      component: Examples,
    },
    {
      name: 'deteil',
      path: "/deteil/:key",
      component: Deteil,
    },
  ],
});
import { markRaw, ref } from "vue";

export let appendComponents = ref<{ component: any, props: any}[]>([])
export const setAppendComponent = (component: any, props?: any) => {
  markRaw(component)
  appendComponents.value.push({ component, props: props || {} })
}

export const fps = ref<number | null>(null)
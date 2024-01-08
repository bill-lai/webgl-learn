import { markRaw, ref } from "vue";

export let appendComponent = ref<{ component: any, props: any}>({ component: null, props: null })
export const setAppendComponent = (component: any, props?: any) => {
  markRaw(component)
  appendComponent.value.component = component
  appendComponent.value.props = props || {}
}

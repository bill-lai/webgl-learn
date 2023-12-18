import { ref } from "vue";

export let appendComponent = ref<any>()
export const setAppendComponent = (component: any) => appendComponent.value = component

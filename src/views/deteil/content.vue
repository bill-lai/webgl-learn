<template>
  <div class="content" :style="style">
    <template v-for="item in appendComponents">
      <component :is="item.component" v-if="item.component" v-bind="item.props" />
    </template>
    <canvas class="gl" ref="canvas"></canvas>
    <span v-if="initProps.fps.value" class="fps">fps: {{ initProps.fps.value }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, watch } from "vue";
import { ExampleInit, InitProps } from "@/status/example";

const props = defineProps<{
  init?: ExampleInit;
  style?: string;
}>();

const appendComponents = ref<{ component: any; props: any }[]>([]);
const initProps: InitProps = {
  fps: ref<number | null>(null),
  setAppendComponent: (component: any, props?: any) => {
    markRaw(component);
    appendComponents.value.push({ component, props: props || {} });
  },
};

const canvas = ref<HTMLCanvasElement>();
watch(
  () => ({ canvas: canvas.value, init: props.init }),
  async ({ canvas, init }, _, onCleanup) => {
    if (canvas && init) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const stop = await init(canvas, initProps);
      stop && onCleanup(() => stop());
    }
  },
  { flush: "post" }
);
</script>

<style scoped lang="scss">
.content {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  canvas {
    min-height: 100vh;
    width: 100%;
    height: 100%;
    display: block;
  }
  .fps {
    position: absolute;
    left: 20px;
    top: 20px;
  }
}
</style>

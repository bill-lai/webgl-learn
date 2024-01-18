<template>
  <div class="app-layout" v-for="(_, ndx) in examples">
    <template v-for="item in appendComponents">
      <component :is="item.component" v-if="item.component" v-bind="item.props" />
    </template>
    <canvas class="gl" :ref="(c: any) => canvasArray[ndx] = c"></canvas>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { appendComponents } from "./append";
import { initsPromise } from "./example/all";

type ExampleEntery = (canvas: HTMLCanvasElement) => void;
const examples = ref<ExampleEntery[]>([]);
initsPromise.then((inits) => {
  examples.value = inits as ExampleEntery[];
  nextTick(startInject);
});
const canvasArray = ref<HTMLCanvasElement[]>([]);

const startInject = () => {
  for (let ndx = 0; ndx < examples.value.length; ndx++) {
    const canvas = canvasArray.value[ndx];
    const initCanvas = examples.value[ndx];
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      console.log(initCanvas);
      initCanvas(canvas);
    }
  }
};
</script>

<style scoped>
.app-layout {
  box-sizing: border-box;
  height: 300px;
  width: 300px;
  display: flex;
  float: left;
  flex-direction: column;
}
.gl {
  background-color: #fff;
}

.header {
  flex: 0 0 100px;
}
.gl {
  flex: 1;
}
div,
canvas {
  padding: 0;
}
</style>

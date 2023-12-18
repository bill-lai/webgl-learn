<template>
  <div class="app-layout">
    <component :is="appendComponent" v-if="appendComponent" />
    <!-- <Matrix class="header" />
    <Kernels /> -->
    <canvas class="gl" ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { initCanvas } from "./example";
import { appendComponent } from "./append";
// import Matrix from "./component/matrix.vue";
// import Kernels from "./component/kernels.vue";

const canvas = ref<HTMLCanvasElement>();
const stop = watchEffect(() => {
  if (canvas.value) {
    canvas.value.width = canvas.value.offsetWidth * 2;
    canvas.value.height = canvas.value.offsetHeight * 2;
    initCanvas(canvas.value);
    stop();
  }
});
</script>

<style scoped>
.app-layout {
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
  display: flex;
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

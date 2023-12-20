<template>
  <div class="text-layout">
    <span v-for="tex in texts" :style="{ left: tex.left + 'px', top: tex.top + 'px' }">
      {{ tex.content }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { texts } from "../status";
</script>

<style lang="scss" scoped>
.text-layout {
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  > span {
    position: absolute;
    padding: 0;
    line-height: 1em;
    transform: translate(-50%, -50%);
  }
}
</style>

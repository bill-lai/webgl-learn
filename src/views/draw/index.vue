<template>
  <div class="app-layout">
    <Content :init="init" />
  </div>
</template>

<script setup lang="ts">
import Content from "@/views/deteil/content.vue";
import { init } from "@/webgl2/demo/learn-11-cube-map";
// import { init } from "@/example/projection";

// fps-camera
</script>

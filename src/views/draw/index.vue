<template>
  <div class="app-layout">
    <Content :init="init" />
  </div>
</template>

<script setup lang="ts">
import Content from "@/views/deteil/content.vue";
import { init } from "@/webgl2/demo/learn-6-lights";
</script>

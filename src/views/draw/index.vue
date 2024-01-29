<template>
  <div class="app-layout">
    <Content :init="init" />
  </div>
</template>

<script setup lang="ts">
import Content from "@/views/deteil/content.vue";
import { init } from "@/example/draw-text/link";
</script>

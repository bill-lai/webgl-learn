<template>
  <template v-if="example">
    <div class="app-layout" :key="key">
      <Content
        :init="example.init"
        :style="`position: ${example.meta.type || 'absolute'}`"
      />
      <div class="info">
        
        <Material :metas="example.meta.material" />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { aModule } from "@/status/example";
import { router } from "@/route";
import Material from "./material.vue";
import Content from "./content.vue";

const key = computed(() => router.currentRoute.value.params.key as string);
const example = computed(() => aModule[key.value]);
</script>

<style scoped lang="scss">
.app-layout {
  width: 100%;
  position: relative;
}

.info {
  background: rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
  padding: 10px 0 25px 20px;
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>

<template>
  <div class="layout">
    <div
      v-for="(model, key) in aModule"
      :key="key"
      class="item"
      @click="router.push({ name: 'deteil', params: { key } })"
    >
      <el-card :body-style="{ padding: '0px' }">
        <img :src="model.meta.cover" class="image" />
        <div style="padding: 14px">
          <span>{{ model.meta.name }}</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { router } from "@/route";
import { aModule } from "@/status/example.ts";
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-wrap: wrap;
}
.item {
  flex: 0 0 auto;
  width: 25%;
  max-width: 400px;
  margin: 10px;
}
.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

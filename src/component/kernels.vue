<template>
  <div>
    <p>集卷类型：</p>
    <el-select v-model="kernelKey" class="m-2" placeholder="Select" size="large">
      <el-option v-for="(_, k) in kernelOptions" :key="k" :label="k" :value="k" />
    </el-select>
  </div>
</template>
<script setup lang="ts">
import { kernelKey, kernelOptions } from "../status";
</script>

<style scoped>
div {
  display: flex;
  align-items: center;
}
</style>

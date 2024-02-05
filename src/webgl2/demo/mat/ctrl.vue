<template>
  <div class="layout">
    <div class="slider-block">
      <span class="demonstration">x</span>
      <el-slider v-model="data.x" v-bind="seting.x" :step="0.1" />
    </div>
    <div class="slider-block">
      <span class="demonstration">y</span>
      <el-slider v-model="data.y" v-bind="seting.y" :step="0.1" />
    </div>
    <div class="slider-block">
      <span class="demonstration">angle</span>
      <el-slider v-model="data.angle" v-bind="seting.angle" :step="0.1" />
    </div>
    <div class="slider-block">
      <span class="demonstration">scaleX</span>
      <el-slider v-model="data.scale[0]" v-bind="seting.scale" :step="0.1" />
    </div>
    <div class="slider-block">
      <span class="demonstration">scaleY</span>
      <el-slider v-model="data.scale[1]" v-bind="seting.scale" :step="0.1" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    x: number;
    y: number;
    angle: number;
    scale: number[];
  };
  seting: {
    x: { min: number; max: number };
    y: { min: number; max: number };
    scale: { min: number; max: number };
    angle: { min: number; max: number };
  };
}>();
</script>

<style lang="scss" scoped>
.layout {
  position: absolute;
  right: 0;
  top: 0;
  padding: 20px;
  width: 300px;
  overflow: hidden;
}

.slider-block {
  display: flex;
  align-items: center;
  .demonstration {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 44px;
    flex: 1;
    margin-bottom: 0;
    width: 100px;
    text-align: right;
    margin-right: 20px;
    flex: 0 0 auto;
  }
  .el-slider {
    flex: 1;
  }
}
</style>

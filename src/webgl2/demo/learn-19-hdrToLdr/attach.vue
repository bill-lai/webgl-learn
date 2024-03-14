<template>
  <div @mousedown.stop class="attach">
    <div class="slider-demo-block">
      <span class="demonstration">曝光度</span>
      <el-slider
        :modelValue="exposure"
        @update:modelValue="updateExposure"
        :step="0.05"
        :min="0.1"
        :max="15"
        show-stops
      />
    </div>
    {{ exposure }}
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  exposure: number;
  updateExposure: (exposure: number) => void;
}>();
</script>

<style lang="scss" scoped>
.attach {
  position: absolute;
  right: 20px;
  top: 20px;
  padding: 10px;
  width: 300px;
  background: rgba(255, 255, 255, 0.3);
}
</style>

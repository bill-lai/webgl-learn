<template>
  <div class="layout">
    <el-select
      v-model="data.type"
      placeholder="type选择"
      style="width: 100%"
      v-if="!Array.isArray(data.type)"
    >
      <el-option v-for="(_, k) in seting.options" :key="k" :label="k" :value="k" />
    </el-select>
    <el-checkbox-group v-model="data.type" v-else>
      <div v-for="(_, k) in seting.options">
        <el-checkbox :label="k" />
      </div>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: { type: string | string[] };
  seting: {
    options: { [key in string]: any };
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

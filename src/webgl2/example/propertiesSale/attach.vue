<template>
  <div @mousedown.stop class="attach">
    {{ formatDate(props.date) }}
    <div class="slider-demo-block">
      <span class="demonstration">选择月份</span>
      <el-slider v-model="month" :step="1" :min="1" :max="12" show-stops />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">选择时间</span>
      <el-slider v-model="minutes" :step="1" :min="0" :max="24 * 60" show-stops />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from "@/util";
import { computed } from "vue";

const props = defineProps<{ date: Date; updateDate: (nDate: Date) => void }>();

const month = computed({
  get: () => {
    const m = props.date.getMonth();
    return m === 0 ? 12 : m;
  },
  set: (nMonth) => {
    const nDate = new Date(props.date);
    nDate.setMonth(nMonth);
    props.updateDate(nDate);
  },
});
const minutes = computed({
  get: () => props.date.getHours() * 60 + props.date.getMinutes(),
  set: (nMinutes) => {
    const nDate = new Date(props.date);
    const nHours = Math.floor(nMinutes / 60);
    nDate.setHours(nHours);
    nDate.setMinutes(nMinutes - nHours * 60);
    props.updateDate(nDate);
  },
});
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

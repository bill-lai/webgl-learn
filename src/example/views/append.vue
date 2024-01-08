<template>
  <div class="sp"><button @click="saveHandler">截图</button></div>
  <div class="views" @scroll="emitUpdatedBoundInfo">
    <div v-for="(item, i) in count" class="item">
      <div class="view" :ref="(dom: any) => doms[i] = dom"></div>
      <p class="label">item-{{ item }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUpdated, shallowRef } from "vue";
import { BoundInfo } from ".";

const props = defineProps<{
  count: number;
  target: HTMLElement;
  onBoundChange: (data: BoundInfo[]) => void;
  save: () => Promise<Blob>;
}>();

const saveHandler = async () => {
  const blob = await props.save();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);
  a.setAttribute("href", url);
  a.setAttribute("download", "截图.png");
  a.click();
};

const doms = shallowRef<HTMLDivElement[]>([]);
const emitUpdatedBoundInfo = () => {
  const targetBound = props.target.getBoundingClientRect();
  const boundInfos = doms.value.map((item) => {
    const bound = item.getBoundingClientRect();
    const left = bound.x - targetBound.x;
    const top = bound.y - targetBound.y;
    const exclude =
      left + bound.width < 0 ||
      top + bound.height < 0 ||
      left > targetBound.width ||
      top > targetBound.height;

    return {
      left,
      top,
      width: bound.width,
      height: bound.height,
      include: !exclude,
    };
  });
  props.onBoundChange(boundInfos);
};

onMounted(emitUpdatedBoundInfo);
onUpdated(emitUpdatedBoundInfo);
</script>

<style lang="scss" scoped>
.sp {
  position: fixed;
  right: 0;
  top: 50%;
  z-index: 1;
}
.views {
  position: absolute;
  overflow-y: scroll;
  inset: 0;
  .item {
    display: inline-block;
    margin: 1em;
    padding: 1em;
  }
  .label {
    margin-top: 0.5em;
  }
  .view {
    width: 250px;
    height: 250px;
    border: 1px solid black;
  }
}
</style>

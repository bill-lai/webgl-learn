<template>
  <el-tabs v-model="current">
    <el-tab-pane :label="meta.name" v-for="meta in metas" :name="meta.name" class="tab">
      <div class="theme-xcode hljs" v-if="meta.type === 'code'">
        <code v-html="meta.content"></code>
      </div>
      <img :src="meta.content" class="tex" v-else />
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import { ExampleMeta } from "@/status/example";
import hljs from "highlight.js";
import { computed, ref } from "vue";

const props = defineProps<{
  metas: ExampleMeta["material"];
}>();

const langMap: { [key in string]: string } = {
  vert: "glsl",
  frag: "glsl",
  ts: "typescript",
};
const metas = computed(() =>
  props.metas.map((item) => {
    let language = item.name.substring(item.name.lastIndexOf(".") + 1);
    language = language in langMap ? langMap[language] : language;

    return {
      ...item,
      content:
        item.type === "code"
          ? hljs.highlight(item.content, { language }).value
          : item.content,
    };
  })
);
const current = ref(metas.value[0].name);
</script>

<style lang="scss" scoped>
.hljs {
  background: none !important;
  code {
    white-space: pre;
  }
}

.tex {
  max-width: 100%;
}
</style>
<style lang="scss">
.theme-arta .hljs-comment,
.theme-arta .hljs-meta,
.theme-arta .hljs-quote {
  color: rgb(192, 185, 175);
}

.el-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  .el-tabs__header {
    flex: none;
  }

  .el-tabs__content {
    flex: 1;
    overflow-y: auto;
  }
}
</style>

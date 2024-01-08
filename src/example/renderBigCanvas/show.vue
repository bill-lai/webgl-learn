<template>
  <div class="layout">
    <button @click="shoot">截图</button>
    <div class="images" :style="{ width: width + 'px', height: height + 'px' }">
      <template v-for="images in imageRows">
        <img v-for="image in images" :src="image" />
        <br />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ imageRows: string[][]; width: number; height: number }>();

const shoot = async () => {
  let blob: Blob;
  for (let i = 0; i < props.imageRows.length; i++) {
    const images = props.imageRows[i];
    for (let j = 0; j < images.length; j++) {
      const image = new Image();
      image.src = images[j];
      const partBlob = await fetch(images[j], { method: "GET" }).then((res) =>
        res.blob()
      );

      if (!blob!) {
        blob = partBlob;
      } else {
        blob = new Blob([blob, partBlob], { type: "image/jpeg" });
      }
    }
  }

  const url = URL.createObjectURL(blob!);
  const a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);
  a.setAttribute("href", url);
  a.setAttribute("download", "截图.png");
  a.click();
};
</script>

<style lang="scss">
.layout {
  overflow-y: auto;
}
.images {
  font-size: 0;
  img {
    display: inline-block;
    margin: 0;
    padding: 0;
  }
}
</style>

<style>
canvas {
  display: none;
  /* position: absolute; */
}
</style>

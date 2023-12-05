<template>
  <div class="layout">
    <div class="slider-demo-block">
      <span class="demonstration">moveX</span>
      <el-slider v-model="moveX" :min="-1000" :max="1000" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">moveY</span>
      <el-slider v-model="moveY" :min="-1000" :max="1000" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">moveZ</span>
      <el-slider v-model="moveZ" :min="-1000" :max="1000" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">scaleX</span>
      <el-slider v-model="scaleX" :min="-5" :max="5" :step="0.01" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">scaleY</span>
      <el-slider v-model="scaleY" :min="-5" :max="5" :step="0.01" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">scaleZ</span>
      <el-slider v-model="scaleZ" :min="-5" :max="5" :step="0.01" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">rotate</span>
      <el-slider v-model="rotate" :min="0" :max="360" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">rotateX</span>
      <el-slider v-model="rotateX" :min="0" :max="360" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">rotateY</span>
      <el-slider v-model="rotateY" :min="0" :max="360" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">rotateZ</span>
      <el-slider v-model="rotateZ" :min="0" :max="360" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">cameraAngle</span>
      <el-slider v-model="cameraAngle" :min="0" :max="360" :step="1" />
    </div>

    <div class="slider-demo-block">
      <span class="demonstration">fudgeFactor</span>
      <el-slider v-model="fudgeFactor" :min="0" :max="2" :step="0.001" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">shininess</span>
      <el-slider v-model="shininess" :min="1" :max="300" :step="0.001" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">lightLimit</span>
      <el-slider v-model="lightLimit" :min="0" :max="180" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">innerLightLimit</span>
      <el-slider v-model="innerLightLimit" :min="0" :max="180" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">outLightLimit</span>
      <el-slider v-model="outLightLimit" :min="0" :max="180" :step="1" />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">lightColor</span>
      <el-color-picker
        show-alpha
        :model-value="htmlLightColor"
        @active-change="updateLightColor"
      />
    </div>
    <div class="slider-demo-block">
      <span class="demonstration">specularColor</span>
      <el-color-picker
        show-alpha
        :model-value="htmlSpecularColor"
        @active-change="updateSpecularColor"
      />
    </div>

    <div class="slider-demo-block">
      <span class="demonstration">color</span>
      <el-color-picker show-alpha :model-value="htmlColor" @active-change="updateColor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref, computed } from "vue";
import {
  moveX,
  moveY,
  fudgeFactor,
  shininess,
  lightColor,
  specularColor,
  lightLimit,
  moveZ,
  scaleX,
  scaleY,
  scaleZ,
  rotate,
  rotateX,
  innerLightLimit,
  outLightLimit,
  rotateY,
  rotateZ,
  color,
  cameraAngle,
} from "../status/index";
import { ElColorPicker } from "element-plus";

const getColorComProps = (state: Ref<number[]>) => {
  const reg = /rgba\((\d+), (\d+), (\d+), (\d+)\)/;
  const update = (colorStr: string | null) => {
    let regResult: RegExpMatchArray | null;
    if (colorStr && (regResult = colorStr.match(reg))) {
      state.value = [
        Number(regResult[1]) / 255,
        Number(regResult[2]) / 255,
        Number(regResult[3]) / 255,
        Number(regResult[4]),
      ];
    }
  };

  const color = computed({
    get() {
      const normalColor = state.value.slice(0, 3).map((n) => n * 255);
      return `rgba(${[...normalColor, state.value[3]].join(",")})`;
    },
    set(hColor: string) {
      console.log(hColor);
      hColor;
    },
  });
  return { update, color };
};

const { color: htmlColor, update: updateColor } = getColorComProps(color);
const { color: htmlLightColor, update: updateLightColor } = getColorComProps(lightColor);
const { color: htmlSpecularColor, update: updateSpecularColor } = getColorComProps(
  specularColor
);
</script>

<style lang="scss">
.layout {
  display: flex;
  width: 100%;
  flex-wrap: wrap;

  .slider-demo-block {
    box-sizing: border-box;
    width: 33%;
    padding: 0 10px;
    display: flex;

    .demonstration {
      width: 100px;
    }
  }
}
</style>

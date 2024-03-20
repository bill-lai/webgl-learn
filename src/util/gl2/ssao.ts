import { rand } from "@/example/util";
import { vec3 } from "gl-matrix";
import { lerp } from "..";
import { createTex } from "./gl";

// 在半球内随机抽取点，用来比对采样
export const getSsaoKernel = (numKernels = 64) => {
  const kernel: vec3[] = [];
  for (let i = 0; i < numKernels; i++) {
    const sample = vec3.fromValues(rand(-1, 1), rand(-1, 1), rand(0, 1));
    vec3.normalize(sample, sample);
    // 让采样点更加均匀的分布在原点
    const scale = lerp(0.1, 1, Math.pow(i / numKernels, 2)) * rand(0, 1);
    // 随机点
    vec3.scale(sample, sample, scale);
    kernel.push(sample);
  }
  return kernel;
};

// 获取原点的随机旋转轴，在半球内
export const getSsaoNoise = (numNoises = 16) => {
  const noises = new Float32Array(numNoises * 3);
  for (let i = 0; i < numNoises; i++) {
    noises.set(vec3.fromValues(rand(-1, 1), rand(-1, 1), rand(0, 1)), i * 3);
  }
  return noises;
};

export const getSsaoNoiseTex = (gl: WebGL2RenderingContext, numNoises = 16) => {
  const noisesTexSize = Math.sqrt(numNoises);
  return createTex(
    gl,
    {
      internalformat: gl.RGB16F,
      format: gl.RGB,
      type: gl.FLOAT,
      filter: [gl.NEAREST, gl.NEAREST],
      wrap: [gl.REPEAT, gl.REPEAT],
      size: [noisesTexSize, noisesTexSize],
    },
    getSsaoNoise(numNoises)
  );
};

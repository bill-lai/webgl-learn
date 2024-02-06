import { glMatrix, mat4, vec3 } from "gl-matrix";
import dotFragSource from "./shader-dot-light.frag?raw";
import directionFragSource from "./shader-direction-light.frag?raw";
import shaderSpotLightSource from "./shader-spot-light.frag?raw";

import { createTransform, scale } from "@/util/gl2/mat4-pack";

export const dot = {
  fragSource: dotFragSource,
  // 点光源
  lightFactory: () => {
    const initPosition = vec3.fromValues(0, 0, 5);
    const lightTransform = createTransform();
    const position = vec3.copy(vec3.create(), initPosition);
    const lightCubeTransform = createTransform({ reverse: true })
      .scale([0.1, 0.1, 0.1])
      .gen();

    return {
      update(now: number) {
        now *= 0.001;
        lightTransform.rotateY(now * 60).transform(initPosition, position);
        lightCubeTransform.translate(position).gen();
      },
      lightCubeMat: lightCubeTransform.getOut(),
      uniforms: {
        position,
        constant: 1,
        linear: 0.022,
        quadratic: 0.0019,
      },
    };
  },
};

export const direction = {
  fragSource: directionFragSource,
  // 点光源
  lightFactory: () => {
    const lightTransform = createTransform({ reverse: true })
      .scale([0.1, 0.1, 0.1])
      .translate([0, 0, 5]);
    const direction = vec3.create();
    vec3.scale(direction, lightTransform.transform([0, 0, 0], direction), -1);

    return {
      update(now: number) {
        now *= 0.001;
        lightTransform.rotateY(now * 60).transform([0, 0, 0], direction);

        vec3.scale(direction, direction, -1);
      },
      lightCubeMat: lightTransform.getOut(),
      uniforms: { direction: direction },
    };
  },
};

export const spotlight = {
  fragSource: shaderSpotLightSource,
  // 点光源
  lightFactory: (viewMat: mat4) => {
    // 用观察者作为视角
    const direction = vec3.create();
    const position = vec3.create();
    const eysMat = mat4.invert(mat4.create(), viewMat);
    const updateDirection = () => {
      mat4.invert(eysMat, viewMat);
      direction[0] = -eysMat[8];
      direction[1] = -eysMat[9];
      direction[2] = -eysMat[10];

      position[0] = eysMat[12];
      position[1] = eysMat[13];
      position[2] = eysMat[14];
    };
    updateDirection();

    return {
      update(now: number) {
        updateDirection();
      },
      lightCubeMat: scale([0, 0, 0]),
      uniforms: {
        direction,
        position,
        cutOff: Math.cos(glMatrix.toRadian(10)),
        outerOff: Math.cos(glMatrix.toRadian(15)),
        constant: 1,
        linear: 0.045,
        quadratic: 0.0075,
      },
    };
  },
};

export type LightType = typeof dot | typeof direction | typeof spotlight;

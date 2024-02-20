import { createTransform } from "@/util/gl2/mat4-pack";
import { glMatrix, mat4, vec3 } from "gl-matrix";

export const dotLights = [
  {
    uniforms: {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 1],
      specluar: [1, 1, 1],
      position: [-5, 0, 0],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    lightCubeMat: createTransform()
      .translate([-5, 0, 0])
      .scale([0.1, 0.1, 0.1])
      .get(),
  },
  {
    uniforms: {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 1],
      specluar: [1, 1, 1],
      position: [0, 5, 0],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    lightCubeMat: createTransform()
      .translate([0, 5, 0])
      .scale([0.1, 0.1, 0.1])
      .get(),
  },
  {
    uniforms: {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 1],
      specluar: [1, 1, 1],
      position: [5, 0, 0],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    lightCubeMat: createTransform()
      .translate([5, 0, 0])
      .scale([0.1, 0.1, 0.1])
      .get(),
  },
  {
    uniforms: {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 1],
      specluar: [1, 1, 1],
      position: [0, -5, 0],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    lightCubeMat: createTransform()
      .translate([0, -5, 0])
      .scale([0.1, 0.1, 0.1])
      .get(),
  },
];

export const directionLight = {
  uniforms: {
    ambient: [0.1, 0.1, 0.1],
    diffuse: [1, 1, 1],
    specluar: [1, 1, 1],
    direction: [0, 0, -1],
  },
  lightCubeMat: createTransform()
    .translate([0, 100, 0])
    .scale([0.2, 0.2, 0.2])
    .get(),
};

export const spotlight = {
  uniforms: {
    ambient: [0, 0, 0],
    diffuse: [1, 1, 1],
    specluar: [1, 1, 1],
    cutOff: Math.cos(glMatrix.toRadian(10)),
    outerOff: Math.cos(glMatrix.toRadian(12)),
    position: vec3.create(),
    direction: vec3.create(),
    constant: 1,
    linear: 0.0022,
    quadratic: 0.00019,
  },
  texMat: mat4.create(),
  update(viewMat: mat4, projectionMat: mat4, fledView: number) {
    const eysMat = mat4.invert(mat4.create(), viewMat);
    spotlight.uniforms.direction[0] = -eysMat[8];
    spotlight.uniforms.direction[1] = -eysMat[9];
    spotlight.uniforms.direction[2] = -eysMat[10];
    spotlight.uniforms.position[0] = eysMat[12];
    spotlight.uniforms.position[1] = eysMat[13];
    spotlight.uniforms.position[2] = eysMat[14];
  },
};

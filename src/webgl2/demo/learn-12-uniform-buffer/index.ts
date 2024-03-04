import vertSource from "./shader.vert?raw";
import fragSource1 from "./shader-1.frag?raw";
import fragSource2 from "./shader-2.frag?raw";
import fragSource3 from "./shader-3.frag?raw";
import fragSource4 from "./shader-4.frag?raw";
import { createShader, generateProgram } from "@/util/gl2/program";
import { createCube } from "@/util";
import { generateVao, setUniformBlockFactory } from "@/util/gl2/gl";
import { glMatrix, mat4 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";

const getObject = (gl: WebGL2RenderingContext) => {
  const cube = createCube(1);
  const pointers = [
    {
      loc: 1,
      size: 3,
      stride: 0,
      offset: 0,
      key: "positions",
      type: gl.FLOAT,
    } as const,
    {
      loc: 2,
      size: 3,
      stride: 0,
      offset: 0,
      key: "normals",
      type: gl.FLOAT,
    } as const,
  ];
  const vao = generateVao(gl, cube, pointers);

  return {
    vao,
    numElements: cube.includes.length,
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const vShader = createShader(gl, gl.VERTEX_SHADER, vertSource);
  const fSources = [fragSource1, fragSource2, fragSource3, fragSource4];
  const programs = fSources.map((fSource) =>
    generateProgram(gl, vShader, createShader(gl, gl.FRAGMENT_SHADER, fSource))
  );
  const { vao, numElements } = getObject(gl);
  const offset = 3;
  const worldMats = [
    createTransform().translate([-offset, -offset, 0]).scale([3, 3, 3]).get(),
    createTransform().translate([-offset, offset, 0]).scale([3, 3, 3]).get(),
    createTransform().translate([offset, -offset, 0]).scale([3, 3, 3]).get(),
    createTransform().translate([offset, offset, 0]).scale([3, 3, 3]).get(),
  ];
  const normalMats = worldMats.map((mat) => {
    const normalMat = mat4.create();
    mat4.invert(normalMat, mat);
    return mat4.transpose(normalMat, normalMat);
  });
  const matByte = Float32Array.BYTES_PER_ELEMENT * 4 * 4;
  const setUniformBlock = setUniformBlockFactory(
    gl,
    programs,
    "mats",
    0,
    2 * matByte,
    {
      data: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        canvas.width / canvas.height,
        0.1,
        100
      ) as Float32Array,
      byteOffset: 0,
    }
  );

  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);

    for (let i = 0; i < programs.length; i++) {
      gl.useProgram(programs[i]);
      setUniforms(gl, programs[i], {
        worldMat: worldMats[i],
        normalMat: normalMats[i],
      });
      gl.drawElements(gl.TRIANGLES, numElements, gl.UNSIGNED_SHORT, 0);
    }
  };

  createFPSCamera(
    canvas.parentElement!,
    (viewMat: mat4) => {
      setUniformBlock({
        data: viewMat as Float32Array,
        byteOffset: matByte,
      });
      redraw();
    },
    [0, 1, 0],
    [0, 0, 13]
  );
};

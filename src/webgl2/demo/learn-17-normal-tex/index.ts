import { createCube, mergeFuns, startAnimation } from "@/util";
// import fragSource from "./shader-fcalc.frag?raw";
// import vertSource from "./shader-fcalc.vert?raw";
import fragSource from "./shader-vcalc.frag?raw";
import vertSource from "./shader-vcalc.vert?raw";
import { genModalsTangentAndBi } from "@/util/gl2/math";
import { generateTex, generateVao, useTex } from "@/util/gl2/gl";
import norURI from "./brickwall_normal.jpg";
import diffuseURI from "./brickwall.jpg";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { createTransform } from "@/util/gl2/mat4-pack";
import { createProgram } from "@/util/gl2/program";
import { setUniforms } from "@/util/gl2/setUniform";

const getObjects = (gl: WebGL2RenderingContext) => {
  const cube = genModalsTangentAndBi(createCube(1));
  const basePointer = {
    size: 3,
    type: gl.FLOAT,
    stride: 0,
    offset: 0,
  };
  const pointers = [
    { ...basePointer, loc: 1, key: "positions" },
    { ...basePointer, loc: 2, key: "normals" },
    { ...basePointer, loc: 3, key: "tangents" },
    { ...basePointer, loc: 4, key: "bitangents" },
    { ...basePointer, loc: 5, key: "texcoords", size: 2 },
  ];

  return {
    vao: generateVao(gl, cube, pointers),
    numElements: cube.includes.length,
  };
};

const getProps = (gl: WebGL2RenderingContext) => {
  const { tex: norTex, loaded: norLoaded } = generateTex(
    gl,
    norURI,
    gl.CLAMP_TO_EDGE,
    gl.RGBA,
    [gl.NEAREST, gl.NEAREST]
  );
  const { tex: diffuseTex, loaded: diffuseLoaded } = generateTex(
    gl,
    diffuseURI,
    gl.CLAMP_TO_EDGE,
    gl.RGBA
  );

  const projectionMat = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );
  const lightDirection = vec3.normalize(vec3.create(), [1, -1, -2]);
  const viewMat = mat4.identity(mat4.create());

  return {
    diffuseTex,
    norTex,
    texLoaded: Promise.all([norLoaded, diffuseLoaded]),
    uniforms: { projectionMat, lightDirection, viewMat },
  };
};

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const objects = getObjects(gl);
  const props = getProps(gl);
  const program = createProgram(gl, vertSource, fragSource);
  const modalMat = mat4.create();
  const normalMat = mat4.create();
  const modalTF = createTransform({ out: modalMat });
  const updateNormalMat = () =>
    mat4.transpose(normalMat, mat4.invert(normalMat, modalMat));

  gl.useProgram(program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);

  let then = Date.now();
  const redraw = () => {
    const now = Date.now();
    const fps = now - then;
    then = now;

    if (fps > 18) {
      console.log(fps);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(objects.vao);

    const uniforms = {
      ...props.uniforms,
      diffuseTex: useTex(gl, props.diffuseTex!, gl.TEXTURE_2D, 0),
      normalTex: useTex(gl, props.norTex!, gl.TEXTURE_2D, 1),
      modelMat: modalMat,
      normalMat,
    };
    setUniforms(gl, program, uniforms);
    gl.drawElements(gl.TRIANGLES, objects.numElements, gl.UNSIGNED_SHORT, 0);
  };
  modalTF.gen();
  updateNormalMat();
  redraw();
  props.texLoaded.then(redraw);

  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat) => {
        mat4.copy(props.uniforms.viewMat, nViewMat);
        redraw();
      },
      [0, 1, 0],
      [0, 0, 5]
    ),
    startAnimation((now) => {
      modalTF
        .rotateY(now * 0.01 * 5)
        .rotateZ(now * 0.01 * 5)
        .gen();
      updateNormalMat();
      redraw();
    })
  );
};

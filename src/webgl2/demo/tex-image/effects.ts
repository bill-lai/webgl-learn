import { ExampleInit } from "@/status/example";
import Ctrl from "./ctrl.vue";
import { computed, reactive, watchEffect } from "vue";
import kernels from "./kernels";

import {
  NumArr,
  createProgramBySource,
  getProjectionMatrix,
  getRectTriangles,
  loadImage,
  multiply,
  scale,
} from "@/util";
import fragmentSource from "./shader-fragment.frag?raw";
import vertexSource from "./shader-vertex.vert?raw";
import texImageURL from "./leaves.jpg";

const bindAttrib = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  size: number[]
) => {
  const positions = getRectTriangles([0, 0, size[0], size[1]]);
  const texcoords = getRectTriangles([0, 0, 1, 1]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionLoc = gl.getAttribLocation(program, "position");
  const positionBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  // stride设置为0是让openGL决定具体步长，只有紧密拍贴才有用，否则就应该设置下一步的距离当前的具体长度
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const texcoordLoc = gl.getAttribLocation(program, "texcoord");
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texcoordLoc);
  gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return {
    useAttrib() {
      gl.bindVertexArray(vao);
    },
    numVertexs: positions.length / 2,
  };
};

const bindUniform = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const matrixLoc = gl.getUniformLocation(program, "matrix");
  const texLoc = gl.getUniformLocation(program, "tex");
  const kernelLoc = gl.getUniformLocation(program, "kernel");

  return {
    useUniform: (
      kernel: number[],
      texIndex: number,
      size: number[],
      matrix: NumArr
    ) => {
      gl.uniform1fv(kernelLoc, kernel);
      gl.uniform1i(texLoc, texIndex);
      gl.uniformMatrix4fv(matrixLoc, false, matrix);
    },
  };
};

const getTexture = (gl: WebGL2RenderingContext, loadCb: () => void) => {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    1,
    1,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0x00])
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  loadImage(texImageURL).then((image) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    loadCb();
  });

  return tex;
};

const usePollingFb = (gl: WebGL2RenderingContext, size: number[]) => {
  const createFb = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      size[0],
      size[1],
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0
    );

    return { fb, tex };
  };

  const fbs = [createFb(), createFb()];
  let ndx = 0;
  return () => {
    let curNdx = ndx;
    ndx = (ndx + 1) % 2;
    return { ...fbs[curNdx], useTex: fbs[ndx].tex };
  };
};

export const init: ExampleInit = (canvas, { setAppendComponent }) => {
  const data = reactive({ type: ["normal"] });
  const useKernels = computed(() =>
    data.type.length ? data.type.map((k) => kernels[k]) : [kernels.normal]
  );

  setAppendComponent(Ctrl, { data, seting: { options: kernels } });

  const gl = canvas.getContext("webgl2")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);
  const w = canvas.width,
    h = canvas.height;
  const imgSize = [240, 180];

  gl.useProgram(program);

  const { useAttrib, numVertexs } = bindAttrib(gl, program, imgSize);
  const { useUniform } = bindUniform(gl, program);
  const useFb = usePollingFb(gl, imgSize);

  const redrawItem = (
    size: number[],
    fb: WebGLFramebuffer | null,
    tex: WebGLTexture | null,
    kernel: number[]
  ) => {
    const matrix = getProjectionMatrix(size[0], size[1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, size[0], size[1]);
    useAttrib();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    useUniform(
      kernel,
      0,
      size,
      fb ? multiply(scale(1, -1, 1), matrix) : matrix
    );
    gl.drawArrays(gl.TRIANGLES, 0, numVertexs);
  };

  const redraw = () => {
    let fb: ReturnType<typeof useFb>;
    useKernels.value.forEach((kernel) => {
      const tex = fb ? fb.tex : texRaw;
      fb = useFb();
      redrawItem(imgSize, fb.fb, tex, kernel);
    });
    redrawItem([w, h], null, fb!.tex, kernels.normal);
  };
  const texRaw = getTexture(gl, redraw);
  watchEffect(redraw);
};

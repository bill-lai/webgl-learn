import {
  GLAttrib,
  GLObject,
  SceneNode,
  createProgramBySource,
  orthographic,
} from "../../util";
import { rand } from "../util";
import drawFragment from "./shader/draw-fragment.frag?raw";
import drawVert from "./shader/draw-vertex.vert?raw";
import updateFragment from "./shader/update-fragment.frag?raw";
import updateVert from "./shader/update-vertex.vert?raw";

let offset = 4;
const createDataTexture = (
  gl: WebGLRenderingContext,
  data: Float32Array | null,
  w: number,
  h: number
) => {
  if (!gl.getExtension("OES_texture_float")) {
    throw "当前浏览器不支持float color";
  }

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + offset);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 关闭通道对其，默认清空下是每次拿四个字节  而我们单通道不是四个字节对其的
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return { offset: offset++, texture };
};

const createFb = (
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  data?: Float32Array
) => {
  const { texture, offset } = createDataTexture(gl, data || null, w, h);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, texture, texOffset: offset };
};

const clipPosition = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
]);

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const drawProgram = createProgramBySource(gl, drawVert, drawFragment);
  const updateProgram = createProgramBySource(gl, updateVert, updateFragment);

  const texWidth = 10;
  const texHeight = 20;
  const count = texWidth * texHeight;
  const idArr = new Array(count).fill(0).map((_, i) => i);
  const positions = new Float32Array(
    idArr.map(() => [rand(canvas.width), rand(canvas.height), 0, 0]).flat()
  );
  const velocity = new Float32Array(
    idArr.map(() => [rand(-300, 300), rand(-300, 300), 0, 0]).flat()
  );
  const ids = new Float32Array(idArr);
  const { offset: velocityTex } = createDataTexture(
    gl,
    velocity,
    texWidth,
    texHeight
  );
  const fbTexs = [
    createFb(gl, texWidth, texHeight, positions),
    createFb(gl, texWidth, texHeight),
  ];

  const object = new GLObject({
    uniforms: {
      u_velocityTex: velocityTex,
      u_texSize: [texWidth, texHeight],
      u_projectiomMatrix: orthographic(
        0,
        canvas.width,
        0,
        canvas.height,
        -1,
        1
      ),
      u_canvasSize: [canvas.width, canvas.height],
    },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl },
      { ids, positions: clipPosition },
      {
        ids: { name: "a_id", size: 1 },
        positions: { size: 2, name: "a_position" },
      }
    ),
    map: { u_positionTex: "uniform1i", u_velocityTex: "uniform1i" },
  });

  let index = 1;
  const redraw = (deltaTime: number) => {
    const nextIndex = (index + 1) % 2;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbTexs[index].fb);
    gl.viewport(0, 0, texWidth, texHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    object.uniforms.u_deltaTime = deltaTime;
    object.uniforms.u_positionTex = fbTexs[nextIndex].texOffset;
    object.draw(gl.TRIANGLES, updateProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    object.uniforms.u_positionTex = fbTexs[index].texOffset;
    object.draw(gl.POINTS, drawProgram, 1, ids.length);
    index = nextIndex;
  };

  let then = 0;
  const animation = (now = 0) => {
    now /= 1000;
    redraw(now - then);
    then = now;
    requestAnimationFrame(animation);
  };
  animation();
};

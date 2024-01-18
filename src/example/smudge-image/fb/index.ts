import vertSource from "./shader-draw-vertex.vert?raw";
import drawFragmentSource from "./shader-draw-fragment.frag?raw";
import displacementFragmentSource from "./shader-displacement-fragment.frag?raw";
import imageURI from '../cover.jpg'
import { bufferPush, createProgramBySource, getRealativeMosePosition, isTwoPower, loadImage, startAnimation } from "../../../util";
import { rand } from "../../util";

const getImageTexture = (gl: WebGLRenderingContext, imageURI: string) => {
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
    new Uint8Array([256])
  );
  gl.generateMipmap(gl.TEXTURE_2D)

  loadImage(imageURI)
    .then(image => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      if (isTwoPower(image.width) && isTwoPower(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D)
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      }
    })
  return tex;
}

const getEffectFb = (gl: WebGLRenderingContext, size: number[]) => {
  const createFb = (data: ArrayBufferView | null) => {
    if (!gl.getExtension('OES_texture_float')) {
      throw "当前浏览器不支持float贴图"
    }

    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size[0], size[1], 0, gl.RGBA, gl.FLOAT, data)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    return { fb, tex }
  }

  const pixelsNum = size[0] * size[1];
  const initData = new Float32Array(pixelsNum * 4)
  for (let i = 0; i < pixelsNum; i++) {
    bufferPush(initData, i, [
      rand(-0.05, 0.05),
      rand(-0.05, 0.05),
      0,
      0
    ])
  }

  const fbs = [createFb(initData), createFb(null)]
  let currentNdx = 0;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return () => {
    const tex = fbs[currentNdx].tex;
    currentNdx = (currentNdx + 1) % 2;
    return {
      useTex: tex,
      fb: fbs[currentNdx].fb
    }
  }
}


const bindAttri = (gl: WebGLRenderingContext) => {
  const positions = new Float32Array([
    -1, 1,
    1, 1,
    -1, -1,
    -1, -1,
    1, 1,
    1, -1,
  ]);
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  return {
    numVertex: positions.length / 2,
    useAttrib: (program: WebGLProgram) => {
      const positionLoc = gl.getAttribLocation(program, 'position')
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLoc)
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)
    }
  }
}


const bindUniform = (gl: WebGLRenderingContext) => {
  const texture = getImageTexture(gl, imageURI)
  const animationTime = 1;
  const proportion = [2 / gl.canvas.width, 2 / gl.canvas.height]
  const pixelRadius = 20
  const mouseRadius = proportion.map(p => p * pixelRadius);

  return (program: WebGLProgram, time: number, mousePosition: number[], texDisplacement: WebGLTexture) => {
    const animationTimeLoc = gl.getUniformLocation(program, 'animationTime');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const mouseRadiusLoc = gl.getUniformLocation(program, 'mouseRadius');
    const mousePositionLoc = gl.getUniformLocation(program, 'mousePosition');
    const textureLoc = gl.getUniformLocation(program, 'texture');
    const texDisplacementLoc = gl.getUniformLocation(program, 'texDisplacement');

    gl.uniform1f(animationTimeLoc, animationTime)
    gl.uniform1f(timeLoc, time * 0.001)
    gl.uniform2fv(mouseRadiusLoc, mouseRadius)
    gl.uniform2fv(mousePositionLoc, mousePosition.map((o, ndx) => o * proportion[ndx]))
    
    gl.activeTexture(gl.TEXTURE0 + 0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(textureLoc, 0)

    gl.activeTexture(gl.TEXTURE0 + 1)
    gl.bindTexture(gl.TEXTURE_2D, texDisplacement)
    gl.uniform1i(texDisplacementLoc, 1)
  }
}

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const drawProgram = createProgramBySource(gl, vertSource, drawFragmentSource);
  const displacementProgram = createProgramBySource(gl, vertSource, displacementFragmentSource);

  const fbBaseSize = 50
  const fbSize = [fbBaseSize, fbBaseSize * canvas.height / canvas.width]
  const { numVertex, useAttrib } = bindAttri(gl)
  const useUniform = bindUniform(gl)
  const useEffectFb = getEffectFb(gl, fbSize)

  let nowTime = 0;
  let mousePosition = [0, 0]
  

  const redraw = () => {
    const { useTex, fb } = useEffectFb()
    const drawsSetting = [
      { fb, size: fbSize, program: displacementProgram },
      { fb: null, size: [canvas.width, canvas.height], program: drawProgram },
    ]
    drawsSetting.forEach(setting => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, setting.fb)
      gl.viewport(0, 0, setting.size[0], setting.size[1])
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(setting.program)
      useAttrib(setting.program)
      useUniform(setting.program, nowTime, mousePosition, useTex)
      gl.drawArrays(gl.TRIANGLES, 0, numVertex)
    })
  }

  document.documentElement.addEventListener('mousemove', ev => {
    const pos = getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY])
    mousePosition = [pos[0], -pos[1]]
    redraw()
  });
  startAnimation((time) => {
    nowTime = time;
    redraw()
  })
}
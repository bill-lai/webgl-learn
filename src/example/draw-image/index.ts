import {
  GLAttrib,
  GLObject,
  SceneNode,
  createProgramBySource,
  generateTexture,
  multiply,
  orthographic,
  rotateZ,
  scale,
  startAnimation,
  translate,
} from "../../util";
import { edgToRad } from "../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";

const loadTexture = (
  gl: WebGLRenderingContext,
  url: string,
) => {
  return new Promise<{ width: number; height: number, offset: number }>(resolve => {
    const offset = generateTexture(gl, url, [1, 1, 1, 1], (image) => {
      const texInfo = { width: image.width, height: image.height, offset };
      resolve(texInfo)
    });
  })
};

const getImageDrawInfo = (
  width: number,
  height: number,
  texInfo: { 
    width: number; 
    height: number, 
    offset: number
  }
) => {
  const speed = 160;
  const direction = [1, -1];
  const drawInfo = {
    ...texInfo,
    srcX: Math.random() * 0.75 * texInfo.width,
    srcY: Math.random() * 0.75 * texInfo.height,
    srcWidth: (Math.random() * 0.25 + 0.25) * texInfo.width,
    srcHeight: (Math.random() * 0.25 + 0.25) * texInfo.width,
    srcAngle: 0,
    x: Math.random() * (width - texInfo.width),
    y: Math.random() * (height - texInfo.height),
    dstWidth: (Math.random() * 0.5 + 0.5) * texInfo.width,
    dstHeight: (Math.random() * 0.5 + 0.5) * texInfo.height,
    update(diffMis: number) {
      const x = drawInfo.x + diffMis * speed * direction[0];
      const y = drawInfo.y + diffMis * speed * direction[1];

      if (x <= 0) {
        direction[0] = 1;
      } else if (x + texInfo.width >= width) {
        direction[0] = -1;
      } else {
        drawInfo.x = x;
      }

      if (y <= 0) {
        direction[1] = 1;
      } else if (y + texInfo.width >= height) {
        direction[1] = -1;
      } else {
        drawInfo.y = y;
      }

      drawInfo.srcAngle += edgToRad(60) * diffMis
    },
  };
  return drawInfo;
};


export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  const images = [
    "/leaves.jpg",
    "/star.jpg",
    "/texure/f-texture.png",
    "/texure/keyboard.jpg",
  ];

  const num = 9;
  const drawInfos: Array<ReturnType<typeof getImageDrawInfo>> = [];
  for (let i = 0; i < num; i++) {
    const texInfo = await loadTexture(
      gl,
      images[(Math.random() * images.length) | 0],
    );
    drawInfos.push(getImageDrawInfo(canvas.width, canvas.height, texInfo));
  }

  const positions = new Float32Array([
    0, 0, 0,
    0, 1, 0,
    1, 0, 0,
    1, 0, 0,
    0, 1, 0,
    1, 1, 0,
  ]);
  
  const object = new GLObject({
    uniforms: { u_texture: 0 },
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program },
      { positions, texcoords: positions  },
      { 
        positions: "a_position", 
        texcoords: { size: 2, name: "a_texcoord", offset: 0, stride: 4 * 3 } 
      }
    ),
    map: { u_texture: 'uniform1i' }
  });
  const prejectionMatrix = orthographic(0, canvas.width, canvas.height, 0, -1, 1);

  gl.viewport(0, 0, canvas.width, canvas.height);
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT)
    drawInfos.forEach(info => {
      const matrix = multiply(
        translate(info.x, info.y, 0),
        scale(info.dstWidth, info.dstHeight, 1),
      )
      object.uniforms.u_matrix = multiply(prejectionMatrix, matrix)
      object.uniforms.u_texture = info.offset
      object.uniforms.u_texMatrix = multiply(
        translate(0.5, 0.5, 0),
        rotateZ(Math.PI + info.srcAngle),
        translate(-0.5, -0.5, 0),
        translate(info.srcX / info.width, info.srcY / info.height, 0),
        scale(info.srcWidth / info.width, info.srcHeight / info.height, 1),
      ) 
      object.draw(gl.TRIANGLES, program)
    })
  };

  let then = 0;
  return startAnimation(now => {
    const mis = (now - then) * 0.001;
    then = now;
    drawInfos.forEach(info => info.update(mis))
    redraw()
  })
};

import { NumArr, bufferPush, generateTexture } from ".";
import tfont from '../example/draw-text/font.json'

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
export const getCharTexImage = (
  text: string,
  width: number,
  height: number
) => {
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.font = "20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(text, width / 2, height / 2);
  return canvas
};

let offset = 0;
const createCharTexture = (gl: WebGLRenderingContext, image: TexImageSource) => {
  const currentOffset = offset++;
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + currentOffset);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  return currentOffset;
}

export const charsTextureGenerateFactory = (
  gl: WebGLRenderingContext, 
  charInfo: { width: number, height: number }, 
) => {
  const charCache: { [key in string]: number } = {};
  return (s: string) => {
    const textures: number[] = []
    for (let i = 0; i < s.length; i++) {
      const c = s.charAt(i);
      if (c in charCache) {
        textures.push(charCache[c])
      } else {
        const charTexImage = getCharTexImage(c, charInfo.width, charInfo.height)
        textures.push(charCache[c] = createCharTexture(gl, charTexImage))
      }
    }

    return { 
      textures, 
      width: charInfo.width * textures.length, 
      height: charInfo.height 
    }
  }
}

export const charsAttribGenerateFactory = (
  gl: WebGLRenderingContext, 
  font: typeof tfont
) => {
  type Reslut = {
    positions: NumArr
    texcoords: NumArr
    size: number
    numVertices: number,
    texture: number

  }
  const texture = generateTexture(gl, font.url, [1, 1, 1, 1])
  const cache: { [key in string]: Reslut} = {}
  
  return (s: string): Reslut => {
    if (cache[s]) return cache[s];

    const positions = new Float32Array(s.length * 2 * 6)
    const texcoords = new Float32Array(s.length * 2 * 6)

    let index = 0
    let x = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charAt(i)
      const info = c in font.info ? font.info[c as '0'] : null;

      if (!info) {
        x += font.spaceWidth;
        continue;
      }
      const xEnd = x + info.width;
      const yEnd = font.letterHeight

      bufferPush(
        positions,
        index,
        [ 
          x, 0, xEnd, 0, x, yEnd,
          x, yEnd, xEnd, 0, xEnd, yEnd
        ]
      )
      const u1 = info.x / font.textureWidth;
      const v1 = (font.textureHeight - info.y - font.letterHeight + 1) / font.textureHeight;
      const u2 = (info.x + info.width - 1 ) / font.textureWidth;
      const v2 = (font.textureHeight - info.y ) / font.textureHeight;

      bufferPush(
        texcoords,
        index,
        [
          x, 0, xEnd, 0, x, yEnd,
          x, yEnd, xEnd, 0, xEnd, yEnd
        ]
      )

      bufferPush(
        texcoords,
        index,
        [
          u1, v1, u2, v1, u1, v2,
          u1, v2, u2, v1, u2, v2
        ]
      )
      x += info.width + font.spacing
      ++index;
    }
    
    return {
      positions: new Float32Array(positions.buffer, 0, index * 12),
      texcoords: new Float32Array(texcoords.buffer, 0, index * 12),
      numVertices: index * 6,
      size: 2,
      texture
    }
  }
}
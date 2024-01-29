function makeDepthColor(depth: number) {
  return "rgb(" + depth + "," + depth + "," + depth + ")";
}

const ctx = document.createElement('canvas').getContext('2d')!;
function makeSprite(depth: boolean) {
  // make an image (these would be made in photoshop ro
  // some other paint program but that's too much work for me
  ctx.canvas.width = 64;
  ctx.canvas.height = 64;
  for (let y = 0; y <= 32; ++y) {
    const halfWidth = (y < 16 ? 1 + y : 33 - y) * 2;
    const width = halfWidth * 2;
    const cy = 16 - y;
    const cw = Math.max(0, 12 - Math.abs(cy) * 2) | 0;
    for (let x = 0; x < width; ++x) {
      const cx = x - halfWidth;
      const inCenter = Math.abs(cy) < 6 && Math.abs(cx) <= cw;
      const onEdge =
        x < 2 ||
        x >= width - 2 ||
        (inCenter && (Math.abs(cx / 2) | 0) === ((cw / 2) | 0));
      const height = onEdge ? 12 : inCenter ? 30 : 10;
      const color = inCenter
        ? cx < 0
          ? "#F44"
          : "#F66"
        : cx < 0
        ? "#44F"
        : "#66F";
      ctx.fillStyle = depth ? makeDepthColor(y + 1) : color;
      const xx = 32 - halfWidth + x;
      const yy = y;
      ctx.fillRect(xx, yy + 32 - height, 1, height);
      if (!depth) {
        ctx.fillStyle = onEdge ? "black" : "#CCF";
        ctx.fillRect(xx, yy + 32 - height, 1, 1);
      }
    }
  }
  return ctx;
}

export const getSprtiesTex = (gl: WebGLRenderingContext) => {
  const colorTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, colorTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeSprite(false).canvas)
  gl.generateMipmap(gl.TEXTURE_2D)

  const deptTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, deptTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeSprite(true).canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)

  return { colorTex, deptTex }
}
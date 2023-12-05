
const ctx = document.createElement("canvas").getContext("2d")!;

const setCanvasSize = function(width: number, height: number) {
  ctx.canvas.width  = width;
  ctx.canvas.height = height;
};

const makeTexture = function(gl: WebGLRenderingContext) {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return tex;
};

type Options = {
  width?: number,
  height?: number,
  color1?: string,
  color2?: string
}

export const makeStripeTexture = function (gl: WebGLRenderingContext, options?: Options) {
  options = options || {};
  var width  = options.width  || 2;
  var height = options.height || 2;
  var color1 = options.color1 || "white";
  var color2 = options.color2 || "black";

  setCanvasSize(width, height);

  ctx.fillStyle = color1 || "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color2 || "black";
  ctx.fillRect(0, 0, width, height / 2);

  return makeTexture(gl);
};

export const makeCheckerTexture = function(gl: WebGLRenderingContext, options?: Options) {
  options = options || {};
  var width  = options.width  || 2;
  var height = options.height || 2;
  var color1 = options.color1 || "white";
  var color2 = options.color2 || "black";

  setCanvasSize(width, height);

  ctx.fillStyle = color1 || "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color2 || "black";
  ctx.fillRect(0, 0, width / 2, height / 2);
  ctx.fillRect(width / 2, height / 2, width / 2, height / 2);

  return makeTexture(gl);
};

export const makeCircleTexture = function(gl: WebGLRenderingContext, options?: Options) {
  options = options || {};
  var width  = options.width  || 128;
  var height = options.height || 128;
  var color1 = options.color1 || "white";
  var color2 = options.color2 || "black";

  setCanvasSize(width, height);

  ctx.fillStyle = color1 || "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color2 || "black";
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.beginPath();
  ctx.arc(0, 0, width / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color1 || "white";
  ctx.beginPath();
  ctx.arc(0, 0, width / 4 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return makeTexture(gl);
};

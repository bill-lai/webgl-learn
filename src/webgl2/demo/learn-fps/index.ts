import { createCube, generateTexture, startAnimation } from "@/util";
import fragmentSource from "./shader-frag.frag?raw";
import vertexSource from "./shader-vertex.vert?raw";
import attribLocs from "../attribLocation.json";
import { mat4, glMatrix, vec3 } from "gl-matrix";
import texURI from "./awesomeface.png";
import { createFPSCamera } from "@/util/gl2/fps-camera";

const createProgram = (gl: WebGL2RenderingContext) => {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(vertexShader);
  }
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragShader, fragmentSource);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    gl.getShaderInfoLog(fragShader);
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(program);
  }

  Object.entries(attribLocs).forEach(([name, loc]) => {
    gl.bindAttribLocation(program, loc, name);
    gl.bindAttribLocation(program, loc, name);
  });

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragShader);

  return program;
};

const getVAO = (gl: WebGL2RenderingContext) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const cube = createCube(1);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.position);
  gl.vertexAttribPointer(attribLocs.position, 3, gl.FLOAT, false, 0, 0);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.texCoords, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribLocs.texcoord);
  gl.vertexAttribPointer(attribLocs.texcoord, 2, gl.FLOAT, false, 0, 0);

  const indiceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indiceBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.includes, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
  return { vao, numVertexs: cube.includes.length };
};

const bindUniform = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const texLoc = gl.getUniformLocation(program, "tex");
  const worldMat4Loc = gl.getUniformLocation(program, "worldMat4");
  const projectionMat4Loc = gl.getUniformLocation(program, "projectionMat4");
  const viewMat4Loc = gl.getUniformLocation(program, "viewMat4");

  const projectionMat4 = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(45),
    gl.canvas.width / gl.canvas.height,
    0.1,
    100
  );

  gl.uniformMatrix4fv(projectionMat4Loc, false, projectionMat4);

  const tex = generateTexture(gl, texURI, [0, 0, 0, 1]);
  gl.uniform1i(texLoc, tex);

  return (viewMatrix: mat4, worldMatrix: mat4) => {
    gl.uniformMatrix4fv(worldMat4Loc, false, worldMatrix);
    gl.uniformMatrix4fv(viewMat4Loc, false, viewMatrix);
  };
};

const initCubeMat4 = [
  vec3.fromValues(0.0, 0.0, 0.0),
  vec3.fromValues(2.0, 5.0, -15.0),
  vec3.fromValues(-1.5, -2.2, -2.5),
  vec3.fromValues(-3.8, -2.0, -12.3),
  vec3.fromValues(2.4, -0.4, -3.5),
  vec3.fromValues(-1.7, 3.0, -7.5),
  vec3.fromValues(1.3, -2.0, -2.5),
  vec3.fromValues(1.5, 2.0, -2.5),
  vec3.fromValues(1.5, 0.2, -1.5),
  vec3.fromValues(-1.3, 1.0, -1.5),
].map((item) => {
  const mat = mat4.create();
  return mat4.translate(mat, mat4.identity(mat), item);
});

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const program = createProgram(gl)!;
  const { vao, numVertexs } = getVAO(gl);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const useUniform = bindUniform(gl, program);
  const cubeMat4: mat4[] = initCubeMat4.map((mat) =>
    mat4.copy(mat4.create(), mat)
  );
  let viewMat = mat4.create();
  createFPSCamera(document.documentElement, (nMat) => {
    viewMat = nMat;
    redraw();
  });

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);

    cubeMat4.forEach((worldMatrix) => {
      useUniform(viewMat, worldMatrix);
      gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0);
    });
  };

  return startAnimation((now) => {
    now *= 0.001;
    for (let i = 0; i < initCubeMat4.length; i++) {
      const cmat4 = cubeMat4[i];
      mat4.multiply(
        cmat4,
        initCubeMat4[i],
        mat4.rotateZ(cmat4, mat4.identity(cmat4), i + now)
      );
    }
    redraw();
  });
};

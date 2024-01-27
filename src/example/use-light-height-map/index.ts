import { NumArr, ShapeAttrib, createSphereVertices, createProgramBySource, createXYPlaneVertices, inverse, lookAt, multiply, rotateY, startAnimation, straightPerspective1, translate, generateTexture, rotateX, } from "../../util";
import { edgToRad } from "../util";
import fragSource from "./shader-fragment.frag?raw";
import vertSource from "./shader-vertex.vert?raw";
import earthBumpImage from './earthBump.jpeg'
import earthColorImage from './earthColor.jpeg'
import earthSpecularImage from './earthSpecular.jpeg'
import { transpose } from "../matrix4";

const bindAttri = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const py = createSphereVertices(1, 40, 40);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, py.positions, gl.STATIC_DRAW );

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, py.texCoords, gl.STATIC_DRAW );

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, py.normals, gl.STATIC_DRAW );

  const includeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, py.includes, gl.STATIC_DRAW)

  return {
    useAttrib: () => {
      const positionLoc = gl.getAttribLocation(program, "position");
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      const texcoordLoc = gl.getAttribLocation(program, "texcoord");
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLoc);
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

      const normalLoc = gl.getAttribLocation(program, "aNormal");
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, includeBuffer)
    },
    numVertexs: py.includes.length,
  };
};

const bindUniform = (gl: WebGLRenderingContext, program: WebGLProgram) => {
  const lightPositionLoc = gl.getUniformLocation(program, 'lightPosition');
  const lightColorLoc = gl.getUniformLocation(program, 'lightColor');
  const ambientColorLoc = gl.getUniformLocation(program, 'ambientColor');
  const normalMatrixLoc = gl.getUniformLocation(program, 'normalMatrix');
  const normalMapLoc = gl.getUniformLocation(program, 'normalMap');
  const specularFactorMapLoc = gl.getUniformLocation(program, 'specularFactorMap');
  const diffuseMapLoc = gl.getUniformLocation(program, 'diffuseMap');
  const displacementMapLoc = gl.getUniformLocation(program, 'displacementMap');
  const projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');
  const worldMatrixLoc = gl.getUniformLocation(program, 'worldMatrix');
  const displacementFactorLoc = gl.getUniformLocation(program, 'displacementFactor');
  
  const aspect = gl.canvas.width / gl.canvas.height
  const projectionMatrix = straightPerspective1(edgToRad(60) / aspect, aspect, 0.1, 1000);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix)
  gl.uniform3fv(lightPositionLoc, [2, 2, 10]);
  gl.uniform3fv(lightColorLoc, [1, 1, 1]);
  gl.uniform3fv(ambientColorLoc, [0.1, 0.1, 0.1]);

  const normalTex = generateTexture(gl, earthBumpImage, [1, 0, 0, 1])
  const specularFactorTex = generateTexture(gl, earthSpecularImage, [1, 0, 0, 1])
  const diffuseTex = generateTexture(gl, earthColorImage, [1, 0, 0, 1])
  gl.uniform1i(normalMapLoc, normalTex);
  gl.uniform1i(specularFactorMapLoc, specularFactorTex);
  gl.uniform1i(diffuseMapLoc, diffuseTex);
  gl.uniform1i(displacementMapLoc, normalTex);
  
  gl.uniform1f(displacementFactorLoc, 0.1);
  

  return (worldMatrix: NumArr) => {
    gl.uniformMatrix4fv(worldMatrixLoc, false, worldMatrix)
    gl.uniformMatrix4fv(normalMatrixLoc, false, transpose(inverse(worldMatrix)))
  }
};

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program)
  gl.enable(gl.DEPTH_TEST)

  gl.getExtension('OES_standard_derivatives')

  const { useAttrib, numVertexs } = bindAttri(gl, program)
  const useUniform = bindUniform(gl, program)

  const redraw = (worldMatrix: NumArr) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    useAttrib()
    useUniform(worldMatrix)
    gl.drawElements(gl.TRIANGLES, numVertexs, gl.UNSIGNED_SHORT, 0)
  }

  startAnimation((time) => {
    redraw(multiply(
      translate(0, 0, -6),
      rotateX(time * 0.001 ),
      rotateY(-time * 0.001),
      rotateX(edgToRad(180)),
    ));
  })
}
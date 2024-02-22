import { watchEffect } from "vue";
import {
  GLAttrib,
  GLObject,
  SceneNode,
  canvasMouseTranslate,
  createPlaneVertices,
  createSphereVertices,
  frameRender,
  generateTexture,
  getSceneNodeByConfig,
  orthographic,
  scale,
  straightPerspective1,
  translate,
} from "../../util";
import { identity, inverse, lookAt, multiply } from "../matrix4";
import { createProgramBySource, edgToRad } from "../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";
import helpFragSource from "./fragment-help-shader.frag?raw";
import helpVertSource from "./vertex-help-shader.vert?raw";
import { clipPositions } from "../../demo/geo";

const nodes = getSceneNodeByConfig({
  name: "world",
  children: [
    { name: "plane" },
    { name: "shapere", trs: { translate: [2, 3, 4] } },
  ],
});

const getTexture = (gl: WebGLRenderingContext) => {
  const offset = 3;
  const textureData = new Uint8Array([
    0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff,
    0xcc, 0xff, 0xcc, 0xff, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc,
    0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xff, 0xcc, 0xff, 0xcc,
    0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff,
    0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff,
    0xcc, 0xff, 0xcc, 0xff,
  ]);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + offset);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    8,
    8,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    textureData
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return offset;
};

const initMatrix = identity();
export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);
  const helpProgram = createProgramBySource(gl, helpVertSource, helpFragSource);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  const shapereAttrib = new GLAttrib(
    { gl, program },
    createSphereVertices(1, 48, 24),
    {
      texcoords: { name: "a_texcoord", size: 2 },
      positions: "a_position",
    }
  );
  const planeAttrib = new GLAttrib(
    { gl, program },
    createPlaneVertices(20, 20, 1, 1),
    {
      texcoords: { name: "a_texcoord", size: 2 },
      positions: "a_position",
    }
  );
  const helpClipAttrib = new GLAttrib(
    { gl, program: helpProgram },
    clipPositions(),
    { positions: "a_position" }
  );

  const projectionMatrix = straightPerspective1(
    edgToRad(60),
    canvas.width / canvas.height,
    1,
    2000
  );
  const texture = getTexture(gl);
  const projectedTexture = generateTexture(
    gl,
    "/texure/f-texture.png",
    [1, 1, 1, 1],
    () => redraw()
  );
  const shareSetting = {
    uniforms: {
      u_projectedMatrix: initMatrix,
      u_projection: projectionMatrix,
      u_projectedTexture: projectedTexture,
      u_texture: texture,
      u_view: initMatrix,
      u_world: initMatrix,
    },
    map: { u_texture: "uniform1i", u_projectedTexture: "uniform1i" },
  };

  const objects = [
    new GLObject({
      ...shareSetting,
      uniforms: { u_colorMult: [0.5, 0.5, 1, 1], ...shareSetting.uniforms },
      sceneNode: nodes.shapere,
      attrib: shapereAttrib,
    }),
    new GLObject({
      ...shareSetting,
      uniforms: { u_colorMult: [1, 0.5, 0.5, 1], ...shareSetting.uniforms },
      sceneNode: nodes.plane,
      attrib: planeAttrib,
    }),
  ];
  const helpObject = new GLObject({
    uniforms: {
      u_projection: projectionMatrix,
      u_view: initMatrix,
      u_world: initMatrix,
    },
    sceneNode: new SceneNode(),
    attrib: helpClipAttrib,
  });
  // { trs: { scale: [0.5, 0.5, 2000], translate: [0.5, 0.5, 0] } }
  const cameraTarget = [0, 0, 0];
  const cameraUp = [0, 1, 0];
  let cameraPosition = [5, 5, 7];

  let prejectionPosition = [3.5, 4.4, 4.7];
  let prejectionTarget = [0.8, 0, 4.7];
  const prejectionUp = [0, 1, 0];

  const redraw = frameRender(() => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const cameraMatrix = lookAt(cameraPosition, cameraTarget, cameraUp);

    const prejectionMatrix = multiply(
      straightPerspective1(edgToRad(15), 1 / 1, 0.5, 200),
      // orthographic(-0.5, 0.5, -0.5, 0.5, 0.5, 200),
      inverse(lookAt(prejectionPosition, prejectionTarget, prejectionUp))
    );
    const textureMatrix = multiply(
      scale(0.5, 0.5, 0.5),
      translate(1, 1, 1),
      prejectionMatrix
    );

    const viewMatrix = inverse(cameraMatrix);

    objects.forEach((obj) => {
      obj.uniforms.u_view = viewMatrix;
      obj.uniforms.u_world = obj.sceneNode.worldMatrix.value;
      obj.uniforms.u_projectedMatrix = textureMatrix;
      obj.draw();
    });

    helpObject.uniforms.u_view = viewMatrix;
    helpObject.uniforms.u_world = multiply(
      inverse(prejectionMatrix),
      helpObject.sceneNode.worldMatrix.value
    );
    helpObject.draw(gl.LINES);
  });

  // const move = canvasMouseTranslate(canvas, true, cameraPosition, 100)
  // watchEffect(() => {
  //   cameraPosition = move.value
  //   redraw()
  // })
  const move = canvasMouseTranslate(canvas, true, prejectionPosition, 1);
  watchEffect(() => {
    prejectionPosition = move.value;
    redraw();
  });
};

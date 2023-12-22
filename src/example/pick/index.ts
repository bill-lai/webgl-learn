import {
  GLAttrib,
  GLObject,
  NumArr,
  SceneNode,
  createCone,
  createCube,
  createProgramBySource,
  createSphereVertices,
  inverse,
  multiply,
  randRange,
  rotateX,
  rotateY,
  scale,
  straightPerspective1,
  translate,
} from "../../util";
import { generateFullPickTarget, generatePickTarget } from "../../util/pick";
import { lookAt } from "../matrix4";
import { randColorBuffer } from "../spheres";
import { edgToRad, rand } from "../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";
import { watchEffect } from "vue";

const meshs = [
  createCube(1),
  createSphereVertices(0.5, 12, 6),
  createCone(0.5, 0, 1, 20, 12),
];

export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertSource, fragSource);

  const projectionMatrix = straightPerspective1(
    edgToRad(60),
    canvas.width / canvas.height,
    1,
    2000
  );
  const viewMatrix = inverse(lookAt([0, 0, 50], [0, 0, 0], [0, 1, 0]));

  const objects = meshs.map(
    (mesh) =>
      new GLObject({
        uniforms: {
          u_projectionMatrix: projectionMatrix,
          u_viewMatrix: viewMatrix,
        },
        sceneNode: new SceneNode(),
        attrib: new GLAttrib(
          { gl, program },
          { ...mesh, colors: randColorBuffer(mesh) },
          { positions: "a_position", colors: { name: "a_color", size: 4 } }
        ),
      })
  );

  const count = 100;
  const rang = 20;
  const dnodes: {
    node: SceneNode;
    color: number[];
    initMatrix: NumArr;
    angle: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    dnodes.push({
      node: new SceneNode(),
      angle: edgToRad(rand(-60, 60)),
      color: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
      initMatrix: multiply(
        translate(
          randRange(-rang, rang),
          randRange(-rang, rang),
          randRange(0, rang)
        ),
        scale(2, 2, 2)
      ),
    });
  }

  const renderNode = (
    node: SceneNode,
    i: number,
    color: NumArr,
    currentProjectionMatrix: NumArr = projectionMatrix,
    currnetProgram = program
  ) => {
    const object = objects[i % objects.length];
    
    object.uniforms.u_projectionMatrix = currentProjectionMatrix;
    object.uniforms.u_viewMatrix = viewMatrix;
    object.uniforms.u_worldMatrix = node.worldMatrix.value;
    object.uniforms.u_colorMult = color;
    object.draw(gl.TRIANGLES, currnetProgram);
  };

  // const { activeNode, updateData } = generatePickTarget(
  //   gl,
  //   dnodes,
  //   (program, dnode, color, i, projectionMatrix) => {
  //     renderNode(dnode.node, i, color, projectionMatrix, program);
  //   },
  //   projectionMatrix
  // );

  const { activeNode, updateData } = generateFullPickTarget(
    gl,
    dnodes,
    (program, dnode, color, i) => {
      renderNode(dnode.node, i, color, projectionMatrix, program);
    }
  );

  const redraw = () => {
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    dnodes.forEach(({ node, color }, i) => renderNode(node, i, color));
  };

  watchEffect((oncleanup) => {
    const node = activeNode.value;
    if (node) {
      const oldColor = node.color;
      node.color = [0, 0, 1, 0.7];
      oncleanup(() => (node.color = oldColor));
    }
    redraw();
  });

  const animation = (now = 0) => {
    dnodes.forEach(({ node, initMatrix, angle }) => {
      angle = (now / 1000) * angle;
      node.reMatrix(multiply(initMatrix, rotateX(angle), rotateY(-angle)));
    });
    updateData();
    redraw();
    requestAnimationFrame(animation)
  };
  animation();
};

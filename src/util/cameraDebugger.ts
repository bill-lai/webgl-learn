import { cameraPostions, clipPositions } from "@/demo/geo";
import { GLAttrib, GLObject, NumArr, SceneNode, edgToRad, getPositionsBox, identity, inverse, lerp, lookAt, multiply, orthographic, straightPerspective1 } from ".";

export const enableCameraDebugger = (
  glObjects: GLObject[],
  fieldOnView = edgToRad(60),
  near = 1,
  far = 2000,
  objectsRedraw?: () => void,
  isPerspective = true
) => {
  const targetCameraModel = {
    ...cameraPostions(),
    colors: { value: [0, 0, 0, 255] },
  };
  const clipModel = {
    ...clipPositions(),
    // positions: cubePostions(),
    colors: { value: [0, 0, 0, 255] },
  }

  const targetObject = glObjects[0];
  const targetAttrib = targetObject.attrib;
  const targetCameraAttrib = new GLAttrib(targetAttrib.ctx, targetCameraModel, {
    positions: { name: "a_position" },
    colors: { name: "a_color", normalized: true },
  });
  const clipModelAttrib = new GLAttrib(targetAttrib.ctx, clipModel, {
    positions: { name: "a_position" },
    colors: { name: "a_color", normalized: true },
  });

  const targetGl = targetAttrib.ctx.gl;
  const targetCanvas = targetGl.canvas!;
  const width = (targetCanvas.width / 2) | 0;
  const height = targetCanvas.height;
  const aspect = width / height
  

  const perspectiveMatrix = isPerspective 
    ? straightPerspective1(
        fieldOnView,
        aspect,
        near,
        far
      )
    : [...orthographic(
        -aspect * fieldOnView,
        aspect * fieldOnView,
        fieldOnView,
        -fieldOnView,
        near,
        far,
      )]
  const perspectiveMatrixLeader = straightPerspective1(
    edgToRad(60),
    aspect,
    1,
    2000
  );
  
  const targetModelBox = getPositionsBox(
    glObjects.map(item => item.attrib.data.positions as NumArr)
  );
  const targetModelCenter = [
    lerp(targetModelBox.min[0], targetModelBox.max[0], 0.5),
    lerp(targetModelBox.min[1], targetModelBox.max[1], 0.5),
    lerp(targetModelBox.min[2], targetModelBox.max[2], 0.5),
  ]
  
  const targetPosition = targetModelCenter
  const cameraPosition = [
    targetPosition[0] - (targetModelBox.max[0] - targetModelBox.min[0]) * 5, 
    targetPosition[1] + (targetModelBox.max[1] - targetModelBox.min[1]) * 5, 
    targetPosition[2] - (targetModelBox.max[2] - targetModelBox.min[2]) * 5
  ]

  const cameraMatrix = lookAt(
    cameraPosition,
    targetPosition,
    [0, 1, 0]
  );
  const viewMatrix = multiply(perspectiveMatrixLeader, inverse(cameraMatrix))
  const cameraScale = Math.max(
    lerp(targetModelBox.min[0], targetModelBox.max[0], 0.2),
    lerp(targetModelBox.min[1], targetModelBox.max[1], 0.2),
    lerp(targetModelBox.min[2], targetModelBox.max[2], 0.2),
  )
  const targetCameraSceneNode = new SceneNode({ trs: { scale: cameraScale } });
  const targetCameraObject = new GLObject({
    uniforms: { u_matrix: identity() },
    sceneNode: targetCameraSceneNode,
    attrib: targetCameraAttrib,
  });
  const clipModelSceneNode = new SceneNode({trs: {scale: 1}});
  const clipModelObject = new GLObject({
    uniforms: { u_matrix: identity() },
    sceneNode: clipModelSceneNode,
    attrib: clipModelAttrib,
  });

  
  targetGl.enable(targetGl.SCISSOR_TEST);
  console.log(viewMatrix)

  const redraw = () => {
    targetGl.viewport(0, 0, width, height);
    targetGl.scissor(0, 0, width, height);
    targetGl.clearColor(1, 0.8, 0.8, 1);
    targetGl.clear(targetGl.COLOR_BUFFER_BIT | targetGl.DEPTH_BUFFER_BIT);

    glObjects.forEach(glObject => {
      glObject.perspectiveMatrix = perspectiveMatrix
      !objectsRedraw && glObject.draw();
    })
    objectsRedraw && objectsRedraw() 

    targetGl.viewport(width, 0, width , height);
    targetGl.scissor(width, 0, width, height);
    targetGl.clearColor(0.8, 0.8, 1, 1);
    targetGl.clear(targetGl.COLOR_BUFFER_BIT | targetGl.DEPTH_BUFFER_BIT);

    glObjects.forEach(glObject => {
      glObject.uniforms.u_matrix = multiply(viewMatrix, targetObject.sceneNode.worldMatrix.value);
      !objectsRedraw && glObject.draw();
    })
    objectsRedraw && objectsRedraw() 

    targetCameraObject.uniforms.u_matrix = multiply(
      viewMatrix,
      inverse(targetObject.cameraMatrix!),
      targetCameraSceneNode.worldMatrix.value
    );
    targetCameraObject.draw(targetGl.LINES);

    clipModelObject.uniforms.u_matrix = multiply(
      viewMatrix,
      inverse(targetObject.cameraMatrix!),
      inverse(targetObject.perspectiveMatrix!),
      clipModelSceneNode.worldMatrix.value
    )
    clipModelObject.draw(targetGl.LINES);

    glObjects.forEach(glObject => {
      delete glObject.uniforms.u_matrix;
    })
  };

  return redraw;
};

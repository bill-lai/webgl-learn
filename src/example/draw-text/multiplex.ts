import frag3dSource from "./fragment-3d-shader.frag?raw";
import vert3dSource from "./vertex-3d-shader.vert?raw";
import fragTexSource from "./fragment-tex-shader.frag?raw";
import vertTexSource from "./vertex-tex-shader.vert?raw";
import {
  GLAttrib,
  GLObject,
  SceneNode,
  createPlaneVertices,
  createProgramBySource,
  normalVector,
  straightPerspective1,
  charsTextureGenerateFactory,
} from "../../util";
import { getF3DColorGeometry, getF3DGeometry } from "../../demo/geo";
import { edgToRad } from "../util";
import { inverse, lookAt, multiply } from "../matrix4";
import { names, colors } from './setting.json'


export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program3d = createProgramBySource(gl, vert3dSource, frag3dSource);
  const programTex = createProgramBySource(gl, vertTexSource, fragTexSource);
  const charInfo = { width: 20, height: 20 }
  const charsTextureGenerate = charsTextureGenerateFactory(gl, charInfo)

  const object3d = new GLObject({
    uniforms: {},
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program: program3d },
      {
        positions: getF3DGeometry(),
        colors: getF3DColorGeometry(),
      },
      { positions: "a_position", colors: { name: "a_color", normalized: true } }
    ),
  });

  const objectTex = new GLObject({
    uniforms: {},
    sceneNode: new SceneNode(),
    attrib: new GLAttrib(
      { gl, program: programTex },
      createPlaneVertices(1, 1),
      { positions: "a_position", texcoords: { name: "a_texcoord", size: 2 } }
    ),
    map: { u_texture: "uniform1i" },
  });
  const projectionMatrix = straightPerspective1(
    edgToRad(60),
    canvas.width / canvas.height,
    1,
    2000
  );

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  const redraw = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    // 绘制非透明物体 开启深度更新，关闭混合，
    gl.disable(gl.BLEND);
    // 开启深度信息更新，后方物体不绘制
    gl.depthMask(true);
    nodes3d.forEach((node) => {
      object3d.uniforms.u_matrix = multiply(
        projectionMatrix,
        node.worldMatrix.value
      );
      object3d.draw();
    });

    // 绘制透明物品，由于不要遮挡后方绘制，所以关闭深度更新，同时有透明，要开启混合
    gl.enable(gl.BLEND);
    // canvas2d生成的是预乘的阿尔法通道值，所以我们需要告诉webgl不需要再次预乘
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    // 由于canvas2d生成本身的代预乘的源，所以我们直接传入即可，直接让src乘以1
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // 关闭深度信息更新，后方物体同样绘制
    gl.depthMask(false);
    nodesTex.forEach((node, i) => {
      objectTex.uniforms.u_color = colors[i];
      node.children.forEach((charNode, j) => {
        objectTex.uniforms.u_texture = nameTextures[i].textures[j];
        objectTex.uniforms.u_matrix = multiply(
          projectionMatrix,
          charNode.worldMatrix.value
        );
        objectTex.draw();
      })
    });
  };

  const space = 180;
  const rowNum = 4;
  const colNum = 4;
  const offset = [-50, -75];
  const nodes3d: SceneNode[] = new Array(rowNum * colNum)
    .fill(1)
    .map(() => new SceneNode());
  
  const nameTextures = nodes3d.map((_, i) =>
    charsTextureGenerate(names[i % names.length])
  );
  const nodesTex: SceneNode[] = new Array(rowNum * colNum)
    .fill(1)
    .map((_, index) => {
      const root = new SceneNode()
      nameTextures[index].textures.forEach((_, i) => {
        const charNode = new SceneNode({ 
          parent: root,
          trs: { translate: [charInfo.width * i, 0, 0] }
        })
        charNode.beScale(charInfo.width, 1, charInfo.height)
      })
      return root;
    });
  const cameraRadius = (space * rowNum) / 2 + Math.abs(offset[0]);

  const animation = (now = 0) => {
    now = now / 1000;
    const cameraPosition = [
      Math.cos(now) * cameraRadius,
      0,
      Math.sin(now) * cameraRadius,
    ];
    const viewMatrix = inverse(lookAt(cameraPosition, [0, 0, 0], [0, 1, 0]));

    for (let i = 0; i < rowNum; i++) {
      for (let j = 0; j < colNum; j++) {
        const rowOffset = i - (rowNum - 1) / 2;
        const colOffset = j - (colNum - 1) / 2;
        const translate = [rowOffset * space, colOffset * space];
        const zAngle = now + (colOffset * 3 + rowOffset) * 0.2;
        const yAngle = now + (colOffset * 3 + rowOffset) * 0.1;

        nodes3d[i * colNum + j].reSetTRS();
        nodes3d[i * colNum + j]
          .translate(offset[0], offset[1])
          .rotate(0, yAngle, zAngle)
          .translate(translate[0], translate[1])
          .matrix(viewMatrix);


        const matrix = nodes3d[i * colNum + j].getLocalMatrix();
        // 文字会与F相交我们把f往相机方向位移一段距离来防止相交情况
        const pos = matrix.slice(12, 15);
        const posToCameraDirection = normalVector(pos).map((item) => item * -1);
        // F最大单位为150，往相机方向移动150个单位确保不会相交
        const texPos = [
          pos[0] + posToCameraDirection[0] * 150,
          pos[1] + posToCameraDirection[1] * 150,
          pos[2] + posToCameraDirection[2] * 150,
        ];
        // 距离相机越近字体越大  所以要相应缩小对于字体
        const scale = -texPos[2] / canvas.height;

        nodesTex[i * colNum + j].reSetTRS();
        nodesTex[i * colNum + j]
          .rotate(Math.PI / 2, 0, 0)
          .scale(scale, scale, 1)
          .translate(...(texPos as [number]));
      }
    }

    redraw();
    requestAnimationFrame(animation);
  };
  animation();
};

import { createShader, generateProgram } from "@/util/gl2/program";
import fragSource from "./shader-frag.frag?raw";
import vertSource from "./shader-vert.vert?raw";
import instanceVertSource from "./shader-insts.vert?raw";
import { assimpLoad } from "@/util/gl2/assimp-load";
import { generateAssimpModal, Model } from "@/util/gl2/assimp-modal";
import { Mesh, getMeshUniforms, traverseMesh } from "@/util/gl2/assimp-mesh";
import { Uniforms, setUniforms } from "@/util/gl2/setUniform";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { glMatrix, mat4 } from "gl-matrix";
import { createTransform } from "@/util/gl2/mat4-pack";
import { rand } from "@/example/util";
import { Pointer, VaoBuffers, updateVao } from "@/util/gl2/gl";
import { mergeFuns, startAnimation } from "@/util";

const getModals = async (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  redraw: () => void
) => {
  const objResources = [
    ["/model/planet/", "planet.obj", "planet.mtl"],
    ["/model/rock/", "rock.obj", "rock.mtl"],
  ];

  const modals = await Promise.all(
    objResources.map((objResource) =>
      assimpLoad(
        objResource.slice(1).map((name) => objResource[0] + name)
      ).then((result) => {
        const modal = generateAssimpModal(result, objResource[0]);
        modal.init(gl, program).then(redraw);
        return modal;
      })
    )
  );

  return modals;
};

const bindModals = async (gl: WebGL2RenderingContext, redraw: () => void) => {
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSource);
  const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSource);
  const instVertShader = createShader(gl, gl.VERTEX_SHADER, instanceVertSource);
  const singleProgram = generateProgram(gl, fragShader, vertShader);
  const instanceProgram = generateProgram(gl, fragShader, instVertShader);
  const modals = await getModals(gl, singleProgram, () => redraw());

  modals[1].init(gl, instanceProgram);

  return modals;
};

const bindMatsAttrib = (modal: Model, mats: mat4[]) => {
  const gl = modal.gl!;
  const matsView = new Float32Array(mats.length * 16);
  mats.forEach((mat, i) => {
    matsView.set(mat, i * 16);
  });
  const pointers: Pointer<"mats">[] = [];
  let buffers: VaoBuffers<"mats">;
  for (let i = 0; i < 4; i++) {
    pointers.push({
      loc: 3 + i,
      key: "mats",
      size: 4,
      type: gl.FLOAT,
      stride: 16 * Float32Array.BYTES_PER_ELEMENT,
      offset: i * 4 * Float32Array.BYTES_PER_ELEMENT,
      // 实例化一次才移动指针
      divisor: 1,
    });
  }

  traverseMesh(modal.root, (mesh) => {
    if (!(mesh instanceof Mesh)) return;
    // 创建矩阵顶点坐标
    buffers = updateVao(gl, { mats: matsView }, pointers, modal.getVao(mesh)!);
  });

  return () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.mats);
    mats.forEach((mat, i) => {
      // matsView.set(mat, i * 16);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        i * 16 * Float32Array.BYTES_PER_ELEMENT,
        mat as any
      );
    });
  };
};

const bindRenderModal = (
  modal: Model,
  outUniforms: Uniforms,
  redraw: (numElements: number) => void,
  worldMat?: mat4
) => {
  const gl = modal.gl!;
  const program = modal.program!;

  traverseMesh(modal.root, (mesh) => {
    if (!(mesh instanceof Mesh)) return;
    gl.bindVertexArray(modal.getVao(mesh)!);
    const uniforms = getMeshUniforms(gl, mesh, modal.getTexs(mesh)!);
    gl.useProgram(program);
    setUniforms(gl, program, outUniforms);
    setUniforms(gl, program!, {
      ...uniforms,
      worldMat: worldMat || uniforms.worldMat,
    });
    redraw(mesh.faces.length);
  });
};

const renderSingleModal = (
  modal: Model,
  outUniforms: Uniforms,
  worldMat?: mat4
) => {
  bindRenderModal(
    modal,
    outUniforms,
    (numsElement) => {
      modal.gl!.drawElements(
        modal.gl!.TRIANGLES,
        numsElement,
        modal.gl!.UNSIGNED_SHORT,
        0
      );
    },
    worldMat
  );
};

const renderInstansModal = (
  modal: Model,
  outUniforms: Uniforms,
  numsInstan: number,
  worldMat?: mat4
) => {
  bindRenderModal(
    modal,
    outUniforms,
    (numsElement) => {
      modal.gl!.drawElementsInstanced(
        modal.gl!.TRIANGLES,
        numsElement,
        modal.gl!.UNSIGNED_SHORT,
        0,
        numsInstan
      );
    },
    worldMat
  );
};

export const init = async (canvas: HTMLCanvasElement) => {
  // 开启多重采样，每个像素的多个采样点位， 抗锯齿，
  // 被遮盖的采样点越多，越解决原生的模板深度与颜色，
  const gl = canvas.getContext("webgl2", { antialias: true })!;

  const modals = await bindModals(gl, () => redraw());
  const numsInstan = 2000;
  const rockMats = new Array(numsInstan).fill(0).map(() => mat4.create());
  const rockByPlanetTransforms = rockMats.map((mat) =>
    createTransform({ out: mat })
      .translate([rand(-2.5, 2.5), rand(-2.5, 2.5), rand(-2.5, 2.5)])
      .rotateX(rand(20))
      .rotateY(rand(360))
      .translate([rand(30, 50), 0, 0])
  );
  const rockTransforms = rockMats.map((mat) => {
    const scale = rand(0.05, 0.25);
    return createTransform({ out: mat })
      .rotate(rand(360), [0.4, 0.6, 0.8])
      .scale([scale, scale, scale]);
  });
  const planetMat = mat4.create();
  const planetTransform = createTransform({ out: planetMat })
    .translate([0, -3, 0])
    .scale([4, 4, 4]);
  const uniforms = {
    projectionMat: mat4.perspective(
      mat4.create(),
      glMatrix.toRadian(45),
      canvas.width / canvas.height,
      0.1,
      1000
    ),
    viewMat: mat4.create(),
  };
  const updateMats = bindMatsAttrib(modals[1], rockMats);

  planetTransform.gen();

  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderSingleModal(modals[0], uniforms, planetMat);
    renderInstansModal(modals[1], uniforms, numsInstan);
  };

  return mergeFuns(
    createFPSCamera(
      canvas.parentElement!,
      (nViewMat) => {
        mat4.copy(uniforms.viewMat, nViewMat);
        redraw();
      },
      [0, 1, 0],
      [0, 16, 80],
      { pitch: glMatrix.toRadian(-20), yaw: glMatrix.toRadian(-90) }
    ),

    startAnimation((now) => {
      const planeEdg = now * 0.01 * 3;
      const rockEdg = now * 0.01 * 1;
      const rotateMat = mat4.create();
      mat4.rotateY(
        rotateMat,
        mat4.identity(rotateMat),
        glMatrix.toRadian(planeEdg)
      );
      planetTransform.multiply(rotateMat).gen();

      rockTransforms.forEach((rockTransform, i) => {
        const mat = rockByPlanetTransforms[i]
          .multiply(rockTransform.rotate(planeEdg, [0.4, 0.6, 0.8]).get())
          .get();
        mat4.multiply(
          rockMats[i],
          mat4.rotateY(
            rotateMat,
            mat4.identity(rotateMat),
            glMatrix.toRadian(rockEdg)
          ),
          mat
        );
      });

      updateMats();
      redraw();
    })
  );
};

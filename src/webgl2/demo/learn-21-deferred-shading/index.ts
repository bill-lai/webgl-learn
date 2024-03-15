// 将计算量大的步骤放到最后，片段因为深度遮挡，减少大量不必要的计算，不过显寸会大幅增加
import fillVertSource from "./shader-fill.vert?raw";
import fillFragSource from "./shader-fill.frag?raw";
import posVertSource from "./shader-pos.vert?raw";
import posFragSource from "./shader-pos.frag?raw";
import lightFragSource from "./shader-light.frag?raw";
import imgVertSource from "./shader-img.vert?raw";
import imgFragSource from "./shader-img.frag?raw";
import { assimpLoad } from "@/util/gl2/assimp-load";
import { generateAssimpModal } from "@/util/gl2/assimp-modal";
import {
  createProgram,
  createShader,
  generateProgram,
} from "@/util/gl2/program";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { createTransform } from "@/util/gl2/mat4-pack";
import { Mesh, getMeshUniforms, traverseMesh } from "@/util/gl2/assimp-mesh";
import { Uniforms, setUniforms } from "@/util/gl2/setUniform";
import {
  AppendTexsProps,
  blitBuffer,
  createFb,
  generateVao,
  useTex,
} from "@/util/gl2/gl";
import {
  createSphereVertices,
  createXYPlaneVertices,
  frameRender,
  mergeFuns,
} from "@/util";
import { rand } from "@/example/util";
import { ref, watch } from "vue";
import { getLightRadius } from "@/util/gl2/math";

const getModal = async () => {
  const basePath = "/model/nanosuit/";
  const result = await assimpLoad(
    ["nanosuit.obj", "nanosuit.mtl"].map((name) => basePath + name)
  );
  const modal = generateAssimpModal(result, basePath);
  return modal;
};

const getProps = (gl: WebGL2RenderingContext, size: number[]) => {
  const plan = createXYPlaneVertices(2, 2);
  const sphere = createSphereVertices(2, 12, 24);
  const basePointer = {
    size: 3,
    type: gl.FLOAT,
    stride: 0,
    offset: 0,
  };
  const pointers = [
    { ...basePointer, loc: 0, key: "positions" },
    { ...basePointer, loc: 2, key: "texcoords", size: 2 },
  ];

  const viewMat = mat4.create();
  const eysPosition = vec3.fromValues(-12, 8, 56);
  const rang = 25;
  const modals = new Array(20).fill(0).map(() => ({
    position: vec3.fromValues(rand(-rang, rang), 0, rand(-rang, rang)),
    rotate: rand(-30, 30),
  }));
  const modalMats = modals.map((item) =>
    createTransform()
      .translate([0, 7.7061225, 0])
      .translate(item.position)
      .rotateY(item.rotate)
      .translate([0, -7.7061225, 0])
      .get()
  );
  const lights = [
    {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 1],
      specluar: [1, 1, 1],
      position: [0, 0, -60],
      constant: 1,
      linear: 0.7,
      quadratic: 1.8,
    },
    {
      ambient: [0, 0, 0],
      diffuse: [1, 0, 0],
      specluar: [0.3, 0.3, 0.3],
      position: [0, 50, 0],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    {
      ambient: [0, 0, 0],
      diffuse: [0, 1, 0],
      specluar: [0.3, 0.3, 0.3],
      position: [0, -50, 0],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    {
      ambient: [0, 0, 0],
      diffuse: [0, 0, 1],
      specluar: [0.3, 0.3, 0.3],
      position: [0, 0, 50],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 0],
      specluar: [0.3, 0.3, 0.3],
      position: [0, 0, -50],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
    {
      ambient: [0, 0, 0],
      diffuse: [1, 1, 1],
      specluar: [1, 0, 0],
      position: [0, 0, 30],
      constant: 1,
      linear: 0.022,
      quadratic: 0.0019,
    },
  ].map((light) => ({ ...light, radius: getLightRadius(light, 10 / 256) }));

  const lightsMat = lights.map((light) =>
    createTransform()
      .translate(light.position as vec3)
      .scale([light.radius, light.radius, light.radius])
      .get()
  );

  console.log(lights);
  const colorTexProp: AppendTexsProps[number] = {
    internalformat: gl.RGBA16F,
    format: gl.RGBA,
    type: gl.FLOAT,
  };
  const vertexTexProp: AppendTexsProps[number] = {
    ...colorTexProp,
    internalformat: gl.RGBA32F,
  };
  const texsProp = [
    colorTexProp,
    colorTexProp,
    colorTexProp,
    vertexTexProp,
    vertexTexProp,
  ];
  const fill = createFb(gl, size, texsProp, true);
  const image = createFb(gl, size, colorTexProp, true);

  return {
    fill,
    image,
    dotLights: lights,
    lightsMat,
    lightPosMat: lights.map((item) =>
      createTransform()
        .translate(item.position as vec3)
        .scale([0.2, 0.2, 0.2])
        .get()
    ),
    modalMats,
    eysPosition,
    viewMat,
    uniforms: {
      projectionMat: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        gl.canvas.width / gl.canvas.height,
        0.1,
        1000
      ),
    },
    plan: {
      vao: generateVao(gl, plan, [pointers[0], pointers[1]]),
      numElements: plan.includes.length,
    },
    sphere: {
      vao: generateVao(gl, sphere, [pointers[0]]),
      numElements: sphere.includes.length,
    },
    mouseMat: createTransform().scale([0.3, 0.3, 0.3]).get(),
    mouseColor: [0.7, 0.7, 0.7],
  };
};

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { antialias: false, stencil: true })!;
  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw "当前版本不支持float buffer";
  }
  const size = [canvas.width, canvas.height];
  const imgVertShader = createShader(gl, gl.VERTEX_SHADER, imgVertSource);
  const fillProgram = createProgram(gl, fillVertSource, fillFragSource);
  const posProgram = createProgram(gl, posVertSource, posFragSource);
  const imgProgram = generateProgram(
    gl,
    imgVertShader,
    createShader(gl, gl.FRAGMENT_SHADER, imgFragSource)
  );
  const lightProgram = generateProgram(
    gl,
    imgVertShader,
    createShader(gl, gl.FRAGMENT_SHADER, lightFragSource)
  );
  const props = getProps(gl, size);
  const mousePosition = ref<vec3>();
  const modal = await getModal();

  const redrawScene = () => {
    const redrawModal = (modalMat: mat4) => {
      traverseMesh(modal.root, (mesh) => {
        if (!(mesh instanceof Mesh)) return;
        gl.bindVertexArray(modal.getVao(mesh)!);
        const uniforms = getMeshUniforms(gl, mesh, modal.getTexs(mesh)!);
        const worldMat = mat4.multiply(
          mat4.create(),
          modalMat,
          uniforms.worldMat
        );
        const norMat = mat4.invert(mat4.create(), worldMat);
        mat4.transpose(norMat, norMat);

        setUniforms(gl, fillProgram, { ...uniforms, worldMat, norMat });
        gl.drawElements(gl.TRIANGLES, mesh.faces.length, gl.UNSIGNED_SHORT, 0);
      });
    };

    gl.useProgram(fillProgram);
    gl.viewport(0, 0, size[0], size[1]);

    setUniforms(gl, fillProgram, {
      projectionMat: props.uniforms.projectionMat,
      viewMat: props.viewMat,
    });
    props.modalMats.forEach((mat, ndx) => {
      setUniforms(gl, fillProgram, { id: ndx + 2 });
      redrawModal(mat);
    });
  };

  const redrawImg = (program: WebGLProgram, uniforms: Uniforms) => {
    gl.useProgram(program);
    gl.viewport(0, 0, size[0], size[1]);
    gl.bindVertexArray(props.plan.vao);
    setUniforms(gl, program, uniforms);
    gl.drawElements(gl.TRIANGLES, props.plan.numElements, gl.UNSIGNED_SHORT, 0);
  };

  const redrawMouse = () => {
    gl.useProgram(posProgram);
    gl.bindVertexArray(props.sphere.vao);
    const modelMat = mat4.identity(mat4.create());
    mat4.multiply(
      modelMat,
      mat4.translate(modelMat, modelMat, mousePosition.value!),
      props.mouseMat
    );
    setUniforms(gl, posProgram, {
      modelMat: modelMat,
      projectionMat: props.uniforms.projectionMat,
      viewMat: props.viewMat,
      color: props.mouseColor,
    });
    gl.drawElements(
      gl.TRIANGLES,
      props.sphere.numElements,
      gl.UNSIGNED_SHORT,
      0
    );
  };
  const redrawPos = (mats: mat4[]) => {
    gl.useProgram(posProgram);
    gl.bindVertexArray(props.sphere.vao);

    mats.forEach((modelMat, i) => {
      setUniforms(gl, posProgram, {
        modelMat: modelMat,
        projectionMat: props.uniforms.projectionMat,
        viewMat: props.viewMat,
        color: props.dotLights[i].diffuse,
      });
      gl.drawElements(
        gl.TRIANGLES,
        props.sphere.numElements,
        gl.UNSIGNED_SHORT,
        0
      );
    });
  };

  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.fill.fb);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.disable(gl.STENCIL_TEST);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    redrawScene();

    gl.bindFramebuffer(gl.FRAMEBUFFER, props.image.fb);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.DEPTH_TEST);
    redrawImg(lightProgram, {
      diffuseTex: useTex(gl, props.fill.texs[0], gl.TEXTURE_2D, 0),
      specularTex: useTex(gl, props.fill.texs[1], gl.TEXTURE_2D, 1),
      emissiveTex: useTex(gl, props.fill.texs[2], gl.TEXTURE_2D, 2),
      normalTex: useTex(gl, props.fill.texs[3], gl.TEXTURE_2D, 3),
      fragPositionTex: useTex(gl, props.fill.texs[4], gl.TEXTURE_2D, 4),
      eysPosition: props.eysPosition,
      dotLights: props.dotLights,
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.NEVER, 1, 0xff);
    gl.stencilOp(gl.REPLACE, gl.KEEP, gl.KEEP);
    gl.stencilMask(0xff);
    redrawPos(props.lightsMat);

    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilMask(0x00);
    redrawImg(imgProgram, {
      colorTex: useTex(gl, props.image.texs[0], gl.TEXTURE_2D, 0),
    });

    blitBuffer(gl, props.fill.fb, null, gl.DEPTH_BUFFER_BIT, size);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    redrawPos(props.lightPosMat);

    if (mousePosition.value) {
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.DEPTH_TEST);
      redrawMouse();
    }
  };

  const getMouseTarget = frameRender((_now: number, mousePos: number[]) => {
    const data = new Float32Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, props.fill.fb);
    gl.readBuffer(gl.COLOR_ATTACHMENT4);
    gl.readPixels(
      mousePos[0],
      size[1] - mousePos[1],
      1,
      1,
      gl.RGBA,
      gl.FLOAT,
      data
    );
    return data;
  });

  modal.init(gl, fillProgram).then(redraw);

  canvas.addEventListener("mousemove", async (ev) => {
    const data = await getMouseTarget([ev.offsetX, ev.offsetY]);
    const id = data[3];
    if (id > 1) {
      mousePosition.value = data.slice(0, 3);
    } else {
      mousePosition.value = undefined;
    }
  });
  return mergeFuns(
    createFPSCamera(
      (gl.canvas as HTMLCanvasElement).parentElement!,
      (nViewMat, eys) => {
        mat4.copy(props.viewMat, nViewMat);
        vec3.copy(props.eysPosition, eys);
        redraw();
      },
      [0, 1, 0],
      props.eysPosition,
      { pitch: 0, yaw: -1.5 }
    ),
    watch(mousePosition, redraw)
  );
};

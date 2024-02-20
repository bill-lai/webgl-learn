import { assimpLoad } from "@/util/gl2/assimp-load";
import { assimpParse } from "@/util/gl2/assimp-parse";
import fragSource from "./shader-frag.frag?raw";
import vertexSource from "./shader-vert.vert?raw";
import { createProgram } from "@/util/gl2/program";
import { glMatrix, mat4, vec3 } from "gl-matrix";
import { createFPSCamera } from "@/util/gl2/fps-camera";
import { setUniforms } from "@/util/gl2/setUniform";
import { getPositionsBox, startAnimation } from "@/util";

const getUniforms = (gl: WebGL2RenderingContext, onChange: () => void) => {
  const viewMat = mat4.identity(mat4.create());
  const eysPosition = vec3.fromValues(0, 8, 22);
  const fpsCameraDestory = createFPSCamera(
    (gl.canvas as HTMLCanvasElement).parentElement!,
    (nViewMat, eys) => {
      mat4.copy(viewMat, nViewMat);
      vec3.copy(eysPosition, eys);
      onChange();
    },
    [0, 1, 0],
    eysPosition
  );

  return {
    uniforms: {
      dotLights: [
        {
          ambient: [0, 0, 0],
          diffuse: [0.3, 0.3, 0.3],
          specluar: [0.3, 0.3, 0.3],
          position: [-50, 0, 0],
          constant: 1,
          linear: 0.022,
          quadratic: 0.0019,
        },
        {
          ambient: [0, 0, 0],
          diffuse: [1, 1, 1],
          specluar: [1, 0, 0],
          position: eysPosition,
          constant: 1,
          linear: 0.022,
          quadratic: 0.0019,
        },
      ],
      eysPosition,
      viewMat,
      projectionMat: mat4.perspective(
        mat4.create(),
        glMatrix.toRadian(45),
        gl.canvas.width / gl.canvas.height,
        0.1,
        100
      ),
    },
    destory: fpsCameraDestory,
  };
};

export const init = async (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { stencil: true });
  if (!gl) throw "无法获取gl上下文";
  const program = createProgram(gl, vertexSource, fragSource)!;

  const basePath = "/model/nanosuit/";
  const result = await assimpLoad(
    ["nanosuit.obj", "nanosuit.mtl"].map((name) => basePath + name)
  );
  const modal = assimpParse(result, basePath);

  gl.useProgram(program);
  const redraw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilMask(0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    setUniforms(gl, program, {
      ...uniforms,
      isOutline: 0,
    });
    modal.draw();

    const currentTransform = modal.root.transform;
    modal.root.transform = currentTransform
      .translate([0, 7.7061225, 0])
      .scale([1.07, 1.01, 1.07])
      .translate([0, -7.7061225, 0]);

    gl.disable(gl.DEPTH_TEST);
    gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
    gl.stencilMask(0x00);
    setUniforms(gl, program, {
      ...uniforms,
      isOutline: 1,
      outlineColor: [0.04, 0.28, 0.26],
    });
    modal.draw();
    modal.root.transform = currentTransform;
  };

  const { uniforms, destory } = getUniforms(gl, redraw);
  modal.init({ gl, program }).then(redraw);
  redraw();

  const rotateMesh = modal.root;
  const initTransform = rotateMesh.transform;
  const stop = startAnimation((now) => {
    now = now * 0.001;
    rotateMesh.transform = initTransform.rotateY(now * 60);
    redraw();
  });
  return () => {
    destory();
    stop();
  };
};

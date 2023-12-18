// 模拟方向光源
import vertexSource from "../shader/vertex-shader-2d-16.vert?raw";
import fragmentSource from "../shader/fragment-shader-2d-8.frag?raw";
import {
  GLAttrib,
  GLObject,
  SceneNode,
  createCube,
  createProgramBySource,
  edgToRad,
  inverse,
  lookAt,
  straightPerspective1,
} from "../util";

const getTexture = (gl: WebGLRenderingContext) => {
  const offset = 0;
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + offset);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const data = new Uint8Array([128, 64, 128, 0, 192, 0]);
  // 忽略透明通道
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    3,
    2,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    data
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return offset;
};



export const init = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl")!;
  const program = createProgramBySource(gl, vertexSource, fragmentSource);

  const cameraMatrix = lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0]);
  const viewMatrix = inverse(cameraMatrix);

  const attrib = new GLAttrib({ gl, program }, createCube(1), {
    texCoords: { name: "a_texcoord", size: 2 },
    positions: 'a_position'
  });
  const cubeNodes = [
    new SceneNode(),
    new SceneNode({ trs: {translate: [ -1, 0, 0 ]} }),
    new SceneNode({ trs: {translate: [ 1, 0, 0 ]} }),
  ]
  const cubeTexture = getTexture(gl)
  const objects = [
    new GLObject({
      uniforms: { u_texture: cubeTexture, u_colorMult: [0.5, 1, 1, 1] },
      attrib,
      sceneNode: cubeNodes[0],
      map: { u_texture: "uniform1i" },
      cameraMatrix: viewMatrix,
    }),
    new GLObject({
      uniforms: { u_texture: cubeTexture, u_colorMult: [1, 0.5, 1, 1] },
      attrib,
      sceneNode: cubeNodes[1],
      map: { u_texture: "uniform1i" },
      cameraMatrix: viewMatrix,
    }),
    new GLObject({
      uniforms: { u_texture: cubeTexture, u_colorMult: [1, 1, 0.5, 1] },
      attrib,
      sceneNode: cubeNodes[2],
      map: { u_texture: "uniform1i" },
      cameraMatrix: viewMatrix,
    })
  ]

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);


  const fb = gl.createFramebuffer();
  const fbTextureTarget = 1;
  const fbTextureWidth = 256
  const fbTextureHeight = 256
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    const fbTexture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + fbTextureTarget),
    gl.bindTexture(gl.TEXTURE_2D, fbTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbTextureWidth, fbTextureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    // 将渲染颜色放到贴图中
    // COLOR_ATTACHENT0颜色附加一般用于 RGBA/UNSIGNED_BYTE
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0);


    // 为渲染到贴图添加深度信息
    const deptBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, deptBuffer)
    // 告诉渲染器  深度信息存储到deptBuffer里面
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbTextureWidth, fbTextureHeight)

    // 帧渲染器绑定深度信息
    // 深度附加DEPTH_ATTACHMENT 一般用于DEPTH_COMPONENT16
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, deptBuffer);
  }
  const redraw = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, fbTextureWidth, fbTextureHeight)
    // 置顶清除时用什么颜色填充
    gl.clearColor(.5, .7, 1, 1); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    objects.forEach(object => {
    object.perspectiveMatrix = straightPerspective1(
        edgToRad(60),
        fbTextureWidth / fbTextureHeight,
        1,
        2000
      );
      object.uniforms.u_texture = cubeTexture;
      object.draw();
    })

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    objects.forEach(object => {
      object.perspectiveMatrix = straightPerspective1(
        edgToRad(60),
        canvas.width / canvas.height,
        1,
        2000
      );
      object.uniforms.u_texture = fbTextureTarget;
      object.draw();
    })
  };

  let then = Date.now()
  const animation = (now: number) => {
    const mis = (then - now) / 1000;
    const rad = mis / 2
    then = now;
    // cubeNodes[0].beRotate(rad, rad, 0)
    cubeNodes[1].beRotate(rad, -rad, 0)
    cubeNodes[2].beRotate(-rad, rad, 0)

    redraw();
    requestAnimationFrame(animation)
  }
  redraw();
  animation(Date.now());
};

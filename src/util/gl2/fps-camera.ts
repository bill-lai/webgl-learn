import { ReadonlyVec3, mat4, vec2, vec3 } from "gl-matrix";
import { bindKeyboard } from "..";

export const createFPSCamera = (
  mount: HTMLElement,
  onChange: (viewMat: mat4, eys: vec3, front: vec3) => void,
  worldUp = vec3.fromValues(0, 1, 0),
  initEys: ReadonlyVec3 = vec3.fromValues(0, 0, 3),
  initView: { pitch?: number; yaw?: number } = {}
) => {
  const up = vec3.fromValues(0, 1, 0);
  const eys = vec3.fromValues(initEys[0], initEys[1], initEys[2]);
  // 向量，前沿方向
  const front = vec3.fromValues(0, 0, -1);
  // 俯仰视角
  let pitch = initView.pitch || 0;
  // 偏航角
  let yaw = initView.yaw || -Math.PI / 2;

  const cameraMat = mat4.identity(mat4.create());
  const updateCameraMat = () => {
    const target = vec3.add(vec3.create(), eys, front);
    mat4.lookAt(cameraMat, eys, target, up);
    onChange(cameraMat, eys, front);
  };
  const updateFront = () => {
    front[0] = Math.cos(pitch) * Math.cos(yaw);
    front[1] = Math.sin(pitch);
    front[2] = Math.cos(pitch) * Math.sin(yaw);
    // console.log(pitch, yaw);
    vec3.normalize(front, front);
    vec3.cross(up, vec3.cross(vec3.create(), front, worldUp), front);
  };

  const stopKeyboardWatch = bindKeyboard(
    document.documentElement,
    "wsad",
    (keys, amount) => {
      amount *= 8;
      const move = vec3.create();
      if (["a", "d"].some((k) => keys.includes(k))) {
        const forward = Number(keys.includes("a")) * 2 - 1;
        const direction = vec3.cross(vec3.create(), up, front);
        vec3.scale(move, direction, amount * forward);
      }
      if (["w", "s"].some((k) => keys.includes(k))) {
        const forward = Number(keys.includes("w")) * 2 - 1;
        vec3.scale(move, up, amount * forward);
      }
      vec3.add(eys, eys, move);
      updateCameraMat();
    }
  );

  const start = vec2.create();
  const mousedownHandler = (ev: MouseEvent) => {
    start[0] = ev.offsetX;
    start[1] = ev.offsetY;

    mount.addEventListener("mousemove", mouseMoveHandler);
    mount.addEventListener("mouseup", mouseUpHandler);
  };

  const rotatePixelAmount = 1500;
  const mouseMoveHandler = (ev: MouseEvent) => {
    const end = vec2.fromValues(ev.offsetX, ev.offsetY);
    const move = vec2.sub(vec2.create(), end, start);
    pitch += (move[1] / rotatePixelAmount) * Math.PI;
    if (pitch > 89) {
      pitch = 89;
    } else if (pitch < -89) {
      pitch = -89;
    }
    yaw -= (move[0] / rotatePixelAmount) * Math.PI;
    start[0] = end[0];
    start[1] = end[1];
    updateFront();
    updateCameraMat();
  };

  const mouseUpHandler = () => {
    mount.removeEventListener("mousemove", mouseMoveHandler);
    mount.removeEventListener("moseup", mouseUpHandler);
  };

  const wheelHandler = (ev: WheelEvent) => {
    const amount = ev.deltaY * -0.01;
    const move = vec3.scale(vec3.create(), front, amount);
    vec3.add(eys, eys, move);
    updateCameraMat();
  };

  mount.addEventListener("mousedown", mousedownHandler);
  document.addEventListener("wheel", wheelHandler);

  setTimeout(() => {
    updateFront();
    updateCameraMat();
  });

  return () => {
    stopKeyboardWatch();
    mouseUpHandler();
    document.removeEventListener("wheel", wheelHandler);
  };
};

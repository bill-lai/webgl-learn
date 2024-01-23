import { computed, reactive, ref, watch, watchEffect } from "vue";
import { NumArr, canvasBindLastingMouse, canvasBindMouse, edgToRad, getRealativeMosePosition, inverse, multiply, positionTransform, rotateX, rotateZ, scale, translate } from ".";

type Camera = {
  zoom: number;
  rotation: number;
  x: number;
  y: number;
}

export const bindFPSCamera = (canvas: HTMLCanvasElement, initMatrix: NumArr, projectionMatrix: NumArr) => {
  const camera = reactive({
    zoom: 1,
    rotation: 0,
    x: 0,
    y: 0
  })
  const getCameraMatrix = (inCamera: Camera = camera) => 
    multiply(
      initMatrix,
      translate(inCamera.x, inCamera.y, 0),
      rotateZ(inCamera.rotation),
      scale(1 / inCamera.zoom, 1 / inCamera.zoom, 1)
    )
  const cameraMatrix = computed(getCameraMatrix)
  const getPVMatrix = () => multiply(projectionMatrix, inverse(cameraMatrix.value))
  const getPVInverseMatrix = () => inverse(getPVMatrix())
  const getRealVertexByScreen = (screenPos: number[], inverseMatrix: number[]) => {
    const screenVertex = getRealativeMosePosition(canvas, [screenPos[0], screenPos[1]])
    const clipVertex =[
      screenVertex[0] * 2 / canvas.width,
      -screenVertex[1] * 2 / canvas.height,
      0
    ]
    return positionTransform(clipVertex, inverseMatrix).slice(0, 2);
  }

  const move = (startCamera: Camera, start: number[], end: number[]) => {
    camera.x = startCamera.x + (start[0] - end[0])
    camera.y = startCamera.y + (start[1] - end[1])
  }

  const rotate = (startCamera: Camera, center: number[], start: number[], end: number[]) => {
    const incRotation = edgToRad((start[0] - end[0]) / 3);
    const incMatrix = multiply(
      translate(center[0], center[1], 0),
      rotateZ(incRotation),
      translate(-center[0], -center[1], 0),
      getCameraMatrix(startCamera)
    )
    camera.rotation = startCamera.rotation + incRotation
    camera.x = incMatrix[12]
    camera.y = incMatrix[13]
  }
  
  const cscale = (mouse: number[], incZoom: number) => {
    const newZoom = Math.max(0.03, Math.min(camera.zoom * incZoom, 100));
    const prevPos = getRealVertexByScreen(mouse, getPVInverseMatrix())
    camera.zoom = newZoom
    const lastPos = getRealVertexByScreen(mouse, getPVInverseMatrix())
    camera.x += prevPos[0] - lastPos[0]
    camera.y += prevPos[1] - lastPos[1]
  }


  canvas.addEventListener("mousedown", (ev) => {
    const inverseMatrix = getPVInverseMatrix()
    const startScreen = [ev.offsetX, ev.offsetY];
    const startVertex = getRealVertexByScreen([ev.offsetX, ev.offsetY], inverseMatrix)
    const startCamera = { ...camera }

    const moveHandler = (ev: MouseEvent) => {
      const endScreen = [ev.offsetX, ev.offsetY]
      if (!ev.shiftKey) {
        move(startCamera, startVertex, getRealVertexByScreen(endScreen, inverseMatrix))
      } else {
        rotate(startCamera, startVertex,  startScreen, endScreen)
      }
    };
    const upHandler = () => {
      document.documentElement.removeEventListener("mousemove", moveHandler);
      document.documentElement.removeEventListener("mouseup", upHandler);
    };
    document.documentElement.addEventListener("mousemove", moveHandler);
    document.documentElement.addEventListener("mouseup", upHandler);
  });

  document.documentElement.addEventListener('wheel', ev => {
    cscale([ev.offsetX, ev.offsetY], Math.pow(2, ev.deltaY * -0.01))
  })
  
  return cameraMatrix
}
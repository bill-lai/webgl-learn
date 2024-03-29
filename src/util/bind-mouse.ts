import { computed, ref, } from "vue";
import {  v2 } from "./math-2d";

export const getRealativeMosePosition = (
  canvas: HTMLCanvasElement,
  screenPosition: number[],
  center = [canvas.width / 2, canvas.height / 2]
) => {
  const canvasRect = canvas.getBoundingClientRect();
  const rectWidth = canvasRect.right - canvasRect.left;
  const rectHeight = canvasRect.bottom - canvasRect.top;
  const x =
    ((screenPosition[0] - canvasRect.left) / rectWidth) * canvas.width -
    center[0];
  const y =
    ((screenPosition[1] - canvasRect.top) / rectHeight) * canvas.height -
    center[1];

  return [x, y];
};

export const canvasBindLastingMouse = (
  canvas: HTMLCanvasElement,
  move = ref<(Omit<CanvasMouse, 'end'> &  Partial<Pick<CanvasMouse, 'end'>>) | null>(null)
) => {
  canvas.addEventListener("mousedown", (ev) => {
    move.value = {
      start: [...getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY]), 0],
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey,
      alt: ev.altKey,
    }

    const moveHandler = (ev: MouseEvent) => {
      move.value!.end = [...getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY]), 0]
    };
    const upHandler = () => {
      document.documentElement.removeEventListener("mousemove", moveHandler);
      document.documentElement.removeEventListener("mouseup", upHandler);
    };
    document.documentElement.addEventListener("mousemove", moveHandler);
    document.documentElement.addEventListener("mouseup", upHandler);
  });

  canvas.addEventListener('wheel', ev => {
    move.value = {
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey,
      alt: ev.altKey,
      start: [0, 0, 0],
      end: [0, 0, ev.deltaY]
    } 
  })

  return move;
};


export type CanvasMouse = { 
  start: number[]; 
  end: number[], 
  shift: boolean,
  ctrl: boolean,
  alt: boolean 
}
export const canvasBindMouse = (
  canvas: HTMLCanvasElement,
  move = ref<CanvasMouse | null>(null)
) => {
  canvas.addEventListener("mousedown", (ev) => {
    let start = [...getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY]), 0]
    const keys = {
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey,
      alt: ev.altKey,
    }

    const moveHandler = (ev: MouseEvent) => {
      move.value = {
        ...keys,
        start,
        end: [...getRealativeMosePosition(canvas, [ev.offsetX, ev.offsetY]), 0],
      };
      start = move.value.end;
    };
    const upHandler = () => {
      document.documentElement.removeEventListener("mousemove", moveHandler);
      document.documentElement.removeEventListener("mouseup", upHandler);
    };
    document.documentElement.addEventListener("mousemove", moveHandler);
    document.documentElement.addEventListener("mouseup", upHandler);
  });

  canvas.addEventListener('wheel', ev => {
    move.value = {
      shift: ev.shiftKey,
      ctrl: ev.ctrlKey,
      alt: ev.altKey,
      start: [0, 0, 0],
      end: [0, 0, ev.deltaY]
    } 
  })

  return move;
};


export const canvasMouseTranslate = (
  canvas: HTMLCanvasElement,
  lasting = false,
  init = [0, 0, 0],
  range = canvas.width
) => {
  let translate = init;
  const map = range / canvas.width

  const move = canvasBindMouse(canvas);
  return computed(() => {
    if (move.value === null) {
      return translate;
    }
    const diff = v2.mult(v2.subtract(move.value.end, move.value.start), map);
    const diffZ = (move.value.end[2] - move.value.start[2]) * map
    translate = lasting 
      ? [...v2.add(translate, diff), translate[2] - diffZ]
      : [...diff, diffZ];

    return translate;
  });
};

export const canvasMouseRotate = (
  canvas: HTMLCanvasElement,
  range = 2 * Math.PI
) => {
  const mouseMove = canvasBindMouse(canvas);
  return computed(() => {
    if (mouseMove.value === null) {
      return [0, 0];
    }

    const direction = v2.subtract(mouseMove.value.start, mouseMove.value.end);
    // 使得方向在[-2,2]
    const delta = v2.mult(direction, [2 / canvas.width, 2 / canvas.height]);
    return [delta[0] * range, delta[1] * range];
  });
};

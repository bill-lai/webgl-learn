import { computed, ref, toRaw } from "vue";
import { v2 } from "./math-2d";

const getRealativeMosePosition = (
  canvas: HTMLCanvasElement,
  screenPosition: number[]
) => {
  const canvasRect = canvas.getBoundingClientRect();
  const rectWidth = canvasRect.right - canvasRect.left;
  const rectHeight = canvasRect.bottom - canvasRect.top;
  const x =
    ((screenPosition[0] - canvasRect.left) / rectWidth) * canvas.width -
    canvas.width / 2;
  const y =
    ((screenPosition[1] - canvasRect.top) / rectHeight) * canvas.height -
    canvas.height / 2;

  return [x, y];
};

export const canvasBindMouse = (
  canvas: HTMLCanvasElement,
  move = ref<{ start: number[]; end: number[] } | null>(null),
) => {
  canvas.addEventListener("mousedown", (ev) => {
    let start = [ev.offsetX, ev.offsetY];
    const moveHandler = (ev: MouseEvent) => {
      const current = [ev.offsetX, ev.offsetY]
      move.value = {
        start: getRealativeMosePosition(canvas, start),
        end: getRealativeMosePosition(canvas, current),
      }
      start = current
    };
    const upHandler = () => {
      move.value = null
      document.documentElement.removeEventListener("mousemove", moveHandler);
      document.documentElement.removeEventListener("mouseup", upHandler);
    };
    document.documentElement.addEventListener("mousemove", moveHandler);
    document.documentElement.addEventListener("mouseup", upHandler);
  });

  return move;
};

export const canvasMouseRotate = (canvas: HTMLCanvasElement, range = 2 * Math.PI) => {
  const mouseMove = canvasBindMouse(canvas)
  return computed(() => {
    if (mouseMove.value === null) {
      return [0, 0];
    }

    const direction = v2.subtract(mouseMove.value.start, mouseMove.value.end)
    // 使得方向在[-2,2]
    const delta = v2.mult(direction, [2 / canvas.width, 2 / canvas.height])
    return [delta[0] * range, delta[1] * range]
  })
}
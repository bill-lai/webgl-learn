import { ref, watchEffect } from "vue";
import { canvasBindMouse, createProgramBySource } from "../../../util";
import fragSource from "./fragment-shader.frag?raw";
import vertSource from "./vertex-shader.vert?raw";

export const drawRepeat = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext('webgl')!
  const program = createProgramBySource(gl, vertSource, fragSource)

  gl.useProgram(program)

  const positionIndex = gl.getAttribLocation(program, 'a_position');
  const resolutionIndex = gl.getUniformLocation(program, 'u_resolution');
  const mouseIndex = gl.getUniformLocation(program, 'u_mouse')
  const timeIndex = gl.getUniformLocation(program, 'u_time')

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // first triangle
     1, -1,
    -1,  1,
    -1,  1,  // second triangle
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionIndex)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionIndex, canvas.width, canvas.height);

  const redraw = (mouse: [number, number], time: number) => {
    gl.uniform2f(mouseIndex, ...mouse)
    gl.uniform1f(timeIndex, time)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  const mouse = ref<[number, number]>([0, 0])
  const time = ref(0);
  canvas.addEventListener("mousemove", (ev) => {
    mouse.value = [ev.offsetX, canvas.height - ev.offsetY];
  });

  let then = 0
  const updateTime = (currentTime: number) => {
    time.value = (currentTime - then) / 10000
    currentTime = then
    requestAnimationFrame(updateTime)
  }
  updateTime(0)

  watchEffect(() => {
    redraw(mouse.value, time.value)
  })
}
#version 300 es
precision mediump float;

in vec3 vLightColor;

out vec4 fragColor;

void main() {
  fragColor = vec4(vLightColor, 1);
}
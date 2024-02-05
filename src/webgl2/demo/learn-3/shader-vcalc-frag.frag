#version 300 es
precision mediump float;

in vec3 vFragColor;
uniform vec3 objectColor;

out vec4 fragColor;

void main() {
  fragColor = vec4(vFragColor * objectColor, 1);

}
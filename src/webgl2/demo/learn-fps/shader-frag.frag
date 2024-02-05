#version 300 es
precision mediump float;

uniform sampler2D tex;

in vec2 vTexcoord;

out vec4 oColor;

void main() {
  oColor = texture(tex, vTexcoord);
  oColor = vec4(oColor.rgb, 1);
}
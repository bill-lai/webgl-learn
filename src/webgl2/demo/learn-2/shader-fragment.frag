#version 300 es
precision mediump float;

uniform sampler2D tex1;
uniform sampler2D tex2;

in vec4 vColor;
in vec2 vTexcoord;
out vec4 fragColor;

void main() {
  vec2 xreverse = vec2(1.f - vTexcoord.x, vTexcoord.y);
  // xreverse = vTexcoord;

  fragColor = mix(texture(tex1, vTexcoord), texture(tex2, xreverse), 0.2f);
}
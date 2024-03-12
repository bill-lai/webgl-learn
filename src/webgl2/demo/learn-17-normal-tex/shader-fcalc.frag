#version 300 es
precision mediump float;

uniform sampler2D diffuseTex;
uniform sampler2D normalTex;
uniform vec3 lightDirection;

in vec2 vTexcoord;
in mat3 vTBN;

out vec4 fragColor;

// 在片段着色器计算，效率不高，但是方便
void main(){
  // 位于切线空间，需要转到世界空间
  vec3 normal = vTBN * (texture(normalTex, vTexcoord).rgb * 2.0 - 1.0);
  vec3 color = texture(diffuseTex, vTexcoord).rgb;
  float lightWeight = 0.;
  if (length(normal) > 0.1) {
    lightWeight = max(dot(normal, -lightDirection), 0.) + 0.2;
  }

  fragColor = vec4(color * (lightWeight + 0.2), 1.0);
  // fragColor = vec4(normal, 1.0);
}
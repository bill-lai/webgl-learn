#version 300 es
precision mediump float;

uniform sampler2D diffuseTex;
uniform sampler2D normalTex;

in vec3 vLightDirection;
in vec2 vTexcoord;
out vec4 fragColor;

// 在顶点着色器将所有需要法线计算的都转到切线空间，虽然不方便，但效率高
void main(){
  vec3 normal = texture(normalTex, vTexcoord).rgb * 2.0 - 1.0;
  vec3 color = texture(diffuseTex, vTexcoord).rgb;
  
  float lightWeight = max(dot(normal, -vLightDirection), 0.) + 0.2;
  fragColor = vec4(color * (lightWeight + 0.2), 1.0);
  // fragColor = vec4(normal, 1.0);
}
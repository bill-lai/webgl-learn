#version 300 es

layout(location = 1) in vec4 position;

uniform mat4 lightSpaceMat;
uniform mat4 worldMat;

out vec2 vTexcoord;
void main(){
  gl_Position = lightSpaceMat * worldMat * position;
}
#version 300 es
in vec4 position;
in vec4 aNormal;
in vec2 texcoord;

uniform mat4 projectionMatrix;
uniform mat4 worldMatrix;
uniform mat4 normalMatrix;
uniform sampler2D displacementMap;
uniform float displacementFactor;

out vec2 v_texcoord;
out vec3 v_position;
out vec3 v_normal;

void main(){
  float displacement = texture(displacementMap, texcoord).r * displacementFactor;
  vec3 normal = (normalMatrix * aNormal).xyz;
  
  vec4 worldPosition = worldMatrix * vec4((position.xyz + aNormal.xyz * displacement), position.w);
  gl_Position = projectionMatrix * worldPosition;

  v_normal = normal;
  v_position = worldPosition.xyz;
  v_texcoord = texcoord;
}
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 worldMatrix;
uniform sampler2D texHeight;

varying vec3 v_normal;
varying vec3 v_meshPosition;

void main(){
  float h = texture2D(texHeight, texcoord).r * 10.;
  vec4 meshPosition = vec4(position.x, h, position.zw);
  vec4 worldMeshPosition = worldMatrix * meshPosition;
  gl_Position = projectionMatrix * viewMatrix * worldMeshPosition;

  v_meshPosition = worldMeshPosition.xyz / worldMeshPosition.w;
}
attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 viewMatrix;

varying vec2 v_texcoord;

void main(){
  gl_Position = viewMatrix * vec4(vec3(position.xy, 1).xy, 0, 1);
  v_texcoord = texcoord;
}
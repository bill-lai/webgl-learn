#version 300 es

in vec4 position;
uniform vec2 screenSize;

void main(){
  vec2 clipXY = ((position.xy / screenSize) * 2. - 1.) * vec2(1, -1);
  gl_Position = vec4(clipXY, position.zw);
}
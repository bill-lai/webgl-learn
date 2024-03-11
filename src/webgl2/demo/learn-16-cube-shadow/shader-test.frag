#version 300 es
precision mediump float;

uniform samplerCube tex;
uniform vec3 front;

out vec4 fragColor;
void main(){
  fragColor = vec4(texture(tex, front).rgb, 1);
  // float depth = texture(tex, front).r;
  // fragColor = vec4(depth, depth, depth, 1);
}
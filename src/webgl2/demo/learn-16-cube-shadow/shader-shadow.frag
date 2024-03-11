#version 300 es
precision mediump float;

uniform float farPlane;
uniform vec3 lightPosition;

in vec3 vFragPosition;

out vec4 fragColor;
void main(){
  gl_FragDepth = length(lightPosition - vFragPosition) / farPlane;
  // gl_FragDepth = 1.;

  fragColor = vec4(gl_FragDepth, gl_FragDepth, gl_FragDepth, 1.0);
}
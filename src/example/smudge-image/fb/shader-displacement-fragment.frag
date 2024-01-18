precision mediump float;

uniform float animationTime;
uniform float time;
uniform vec2 mouseRadius;
uniform vec2 mousePosition;
uniform sampler2D texDisplacement;

varying vec2 v_texcoord;

void main(){
  vec4 displacement = texture2D(texDisplacement, v_texcoord);
  vec2 mouseTexcoord = mousePosition * 0.5 + 0.5;
  vec2 radius = mouseRadius / 2.0;
  float animationedTime = displacement.z;

  vec2 mouseDiff = abs(mouseTexcoord - v_texcoord);
  if (mouseDiff.x <= radius.x && mouseDiff.y < radius.y) {
    animationedTime = time + animationTime;
  }

  // if (length(mouseTexcoord - v_texcoord) <= radius.x) {
  //   animationedTime = time + animationTime;
  // }

  gl_FragColor = vec4(displacement.xy, animationedTime, displacement.z);
}
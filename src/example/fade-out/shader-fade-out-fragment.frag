precision mediump float;

uniform sampler2D texture;
uniform float mixAmount;
uniform vec4 faceOutColor;

varying vec2 v_texcoord;

void main() {
  vec4 color = texture2D(texture, v_texcoord);
  gl_FragColor = mix(color, faceOutColor, mixAmount);
}
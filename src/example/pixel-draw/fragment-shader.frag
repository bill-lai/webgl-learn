precision mediump float;

uniform sampler2D pixelIndex;
uniform sampler2D pixelColor;

varying vec2 v_texcoord;

void main(){
  float index = texture2D(pixelIndex, v_texcoord).a * 255.0;
  vec4 color = texture2D(pixelColor, vec2((index + 0.5) / 256.0, 0.5));
  gl_FragColor = color;
  // gl_FragColor = vec4(1, 0, 0, 1);
}
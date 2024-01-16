precision mediump float;

uniform sampler2D texture;
uniform float textureSize;

varying float v_distance;

void main(){
  // mod(v_distance, textureSize) 0-size

  vec2 uv = vec2(mod(v_distance, textureSize) / textureSize, 0.5);
  gl_FragColor = texture2D(texture, uv);
  // gl_FragColor = vec4(1, 0, 0, 1);
}

precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texcoord;

void main(){
  if (v_texcoord.x > 1.0 || v_texcoord.x < 0.0 || v_texcoord.y > 1.0 || v_texcoord.y < 0.0) {
    // discard;
    gl_FragColor = vec4(1, 0, 0, 1);
  } else {
    gl_FragColor = texture2D(u_texture, v_texcoord);
  }
  // gl_FragColor = vec4(0, 0, 0, 1);
}
precision mediump float;

uniform float time;
uniform sampler2D texture;
uniform sampler2D texDisplacement;

varying vec2 v_texcoord;

void main(){
  vec3 displacement = texture2D(texDisplacement, v_texcoord).xyz;
  float t = clamp(displacement.z - time, 0., 1.);
  vec2 texcoord = v_texcoord + displacement.xy * t;

  texcoord.y = 1.0 - texcoord.y;
  gl_FragColor = texture2D(texture, texcoord);
}
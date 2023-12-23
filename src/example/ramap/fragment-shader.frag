precision mediump float;

uniform sampler2D u_ramp;
uniform vec4 u_color;
uniform vec2 u_rampSize;
uniform vec3 u_lightDirection;

varying vec3 v_normal;

void main(){
  vec3 normal = normalize(v_normal);

  float lightWeight = dot(-u_lightDirection, normal);
  // [-1, 1] => [0, 1]
  vec2 uv = vec2(lightWeight * 0.5 + 0.5,  0.5);

  vec2 rampUV = ((uv * (u_rampSize - 1.0)) + 0.5) / u_rampSize;
  vec4 rampColor = texture2D(u_ramp, rampUV);

  // rampColor = vec4(uv.x, uv.x, uv.x, 1);


  gl_FragColor = u_color;
  gl_FragColor *= rampColor;
  // gl_FragColor = vec4(u_color.rgb * lightWeight, u_color.a);
}
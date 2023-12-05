precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_lightColor;

varying vec3 v_normal;
varying vec3 v_lightToFace;
varying vec2 v_texcoord;
varying vec3 v_cameraToFace;


void main(){
  vec3 normal = normalize(v_normal);
  vec3 faceToLight = normalize(-v_lightToFace);
  vec3 faceToCamera = normalize(-v_cameraToFace);
  vec3 halfVert = normalize(faceToLight + faceToCamera);
  float light = dot(normal, faceToLight);
  float specular = 0.0;
  if (light > 0.0) {
    specular = pow(dot(normal, halfVert), 50.0);
  }

  vec4 color = texture2D(u_texture, v_texcoord);
  // vec4 color = vec4(1,0.8,.2,1);

  gl_FragColor = vec4(color.rgb * light + specular , color.a);

  // gl_FragColor = vec4(v_normal * 0.5 + 0.5, 1);
}
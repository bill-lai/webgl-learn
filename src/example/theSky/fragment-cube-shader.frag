precision mediump float;

uniform samplerCube u_texture;
uniform vec3 u_cameraPosition;

varying vec4 v_worldPosition;
varying vec4 v_normal;

void main(){
  vec3 cameraToFaceDirection = normalize(v_worldPosition.xyz / v_worldPosition.w - u_cameraPosition);

  // reflectionDir = eyeToSurfaceDir –  2 * dot(surfaceNormal, eyeToSurfaceDir) * surfaceNormal
  // 反射方向 计算工时为 
  vec3 direction = reflect(cameraToFaceDirection, normalize(v_normal.xyz/v_normal.w));
  gl_FragColor = textureCube(u_texture, direction);
}
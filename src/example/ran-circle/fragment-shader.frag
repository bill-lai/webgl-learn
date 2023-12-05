precision mediump float;

// 环境光
uniform vec3 u_ambientColor;
uniform vec3 u_lightColor;
// 基础颜色
uniform vec3 u_colorMult;
// 反光强度
uniform float u_specularFactor;
uniform float u_shininess;
uniform sampler2D u_texture;

varying vec3 v_lightToFace;
varying vec3 v_faceToCamera;
varying vec2 v_texcoord;
varying vec3 v_normal;

vec3 lar(float l, float s, float p) {
  // 如果是平面可以加上这个，因为正反一样
  // l = abs(l);
  if (l < 0.0) {
    l = 0.0;
    s = 0.0;
  } else {
    s = pow(max(s, 0.0), p);
  }

  return vec3(l, s, 0);
}

void main(){
  vec3 lightToFace = normalize(v_lightToFace);
  vec3 faceToCamera = normalize(v_faceToCamera);
  vec3 normal = normalize(v_normal);

  vec3 halfVer = normalize(faceToCamera - lightToFace);
  vec3 larArgs = lar(
    dot(normal, -lightToFace),
    dot(normal, halfVer),
    u_shininess
  );
  
  vec4 color = texture2D(u_texture, v_texcoord);
  vec3 mutColor = color.rgb * u_colorMult;
  // 灯光照射 + 环境光线 + 反射光
  vec3 lRgb = u_lightColor * (u_colorMult * mutColor * larArgs.x + u_ambientColor * mutColor + larArgs.y * u_specularFactor);
  gl_FragColor = vec4(lRgb, color.a);
}
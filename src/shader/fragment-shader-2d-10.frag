precision mediump float;

uniform vec4 u_color;
// 光颜色
uniform vec3 u_lightColor;
// 反射光颜色
uniform vec3 u_specularColor;
// 光泽度，反光强度
uniform float u_shininess;

// 法向量
varying vec3 v_normal;
// 光源到平面向量
varying vec3 v_lightToface;
// 面到相机的向量
varying vec3 v_faceToCamera;

void main(){
  // 向量单位化, 点乘 方向相同为1 垂直为0 方向相反-1
  vec3 normal = normalize(v_normal);
  vec3 lightToface = normalize(v_lightToface);
  vec3 faceToCamera = normalize(v_faceToCamera);

  // 光源照射下的强度
  float light = dot(normal, lightToface) * -1.0;

  // 面在相机和光源的中分法向量
  vec3 halfVec = normalize(faceToCamera - lightToface);
  float specular = 0.0;
  // 只有光照射的清空下再反射
  if (light > 0.0) {
    // specular = dot(normal, halfVec);
    specular = pow(dot(normal, halfVec), u_shininess);
  }

  gl_FragColor = u_color;
  // 加上带颜色的光源照射
  gl_FragColor.rgb *= u_lightColor * light;
  // 加上当前物体的反射颜色
  gl_FragColor.rgb += u_specularColor * specular;
}
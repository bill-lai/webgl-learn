precision mediump float;

// 平行光方向
uniform vec3 u_lightDirection;
// 模型颜色
uniform vec4 u_color;

// 顶点法向量，由于插值进入所以可能大于1
varying vec3 v_normal;

void main(){
  vec3 normal = normalize(v_normal);

  // 点乘，如果两方向相同返回1，相反返回-1， 垂直返回0
  float light = dot(normal, u_lightDirection) * -1.0;

  gl_FragColor = vec4(u_color.rgb * light, u_color.a);
}
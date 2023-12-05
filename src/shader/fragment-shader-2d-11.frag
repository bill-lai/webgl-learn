precision mediump float;

// 聚光灯效果
uniform vec4 u_color;
uniform vec3 u_lightColor;
uniform vec3 u_lightDirection;
uniform float u_innerLightLimit;
uniform float u_outputLightLimit;
uniform float u_shininess;

varying vec3 v_normal;
varying vec3 v_faceToLight;
varying vec3 v_cameraToFace;



void main(){
  vec3 faceToLight = normalize(v_faceToLight);
  vec3 cameraToFace = normalize(v_cameraToFace);

  float lightStrenght = 0.0;
  float specularStrenght = 0.0;

  // 首先判断是否在照射范围内
  float dotFromDirection = dot(-faceToLight, u_lightDirection);

  // 无渐变 只要照射就加颜色，没有过度效果
  // float inLight = dotFromDirection >= u_innerLightLimit ? 1.0 : 0.0;


  // 添加射灯简便效果， 内圈强光，外圈逐渐渐变到美逛
  // float limitRange = u_innerLightLimit - u_outputLightLimit;
  // 找到在范围中的百分度，clamp能限定范围
  // float inLight = clamp((dotFromDirection - u_outputLightLimit) / limitRange, 0.0, 1.0);
  // 也能使用glsl自带的百分都计算函数
  float inLight = smoothstep(u_outputLightLimit, u_innerLightLimit, dotFromDirection);

  // 加上光色
  lightStrenght = inLight * dot(v_normal, u_lightDirection) * -1.0;
  // 加上反光色
  specularStrenght = inLight * pow(dot(v_normal, faceToLight - cameraToFace), u_shininess);

  vec3 fragRgb = u_lightColor * (u_color.rgb * lightStrenght + specularStrenght);
  gl_FragColor = vec4(fragRgb, u_color.a);
}
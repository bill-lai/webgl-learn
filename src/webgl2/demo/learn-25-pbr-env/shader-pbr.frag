#version 300 es
precision mediump float;

#define PI 3.14159265359
#define F0M 0.04

// 计算反射量
vec3 FSchlick(float dotHV, vec3 c, float m) {
  vec3 F0 = mix(vec3(F0M), c, m);
  return F0 + (1.0 - F0) * pow(1.0 - dotHV, 5.0);
}

// 解决环境变量没有半程向量方法
vec3 FSchlickRoughness(float dotHV, vec3 c, float m, float a) {
  vec3 F0 = mix(vec3(F0M), c, m);
  vec3 cons = max(vec3(1.0 - a), F0);

  return F0 + (cons - F0) * pow(1.0 - dotHV, 5.0);
}



// 计算法线于半程向量方向一致的微平面比例
float NDFGGXTR(float dotNH, float a) {
  // 采用粗糙度的平方看起来更自然
  float a2 = pow(a, 4.0);
  float da = dotNH * dotNH * (a2 - 1.0) + 1.0;
  return a2 / (PI * da * da);
}

// 计算微平面的遮蔽比例（反射出来的光被微平面遮蔽的比例）
float GSchlickGGX(float dotNV, float dotNL, float a) {
  float k = pow(a + 1.0, 2.0) / 8.0;
  // ibl 
  // float k = pow(a, 2.0) / 2.0;
  float g1 = (dotNV / (dotNV * (1.0 - k) + k));
  float g2 = (dotNL / (dotNL * (1.0 - k) + k));
  return g1 * g2;
}

/**
  获取点p出射的辐射量
  p: 照射位置，
  c: 表面颜色或基础反射率
  n: 法线
  v: 出视角 (点到视角)
  l: 入视角 (点到光)
  a: 粗糙度
  m: 金属度
*/
vec3 getLightOut(
  vec3 p, 
  vec3 c, 
  vec3 n, 
  vec3 v, 
  vec3 l, 
  vec3 lp,
  vec3 vp,
  vec3 lc,
  float a, 
  float m
) {
  vec3 h = normalize(v + l);
  float dotNL = max(dot(n, l), 0.0);
  float dotVN = max(dot(v, n), 0.0);
  float dotHV = max(dot(h, v), 0.0);
  float dotNH = max(dot(n, h), 0.0);

  float D = NDFGGXTR(dotNH, a);
  float G = GSchlickGGX(dotVN, dotNL, a);
  vec3  F = FSchlick(dotHV, c, m);

  vec3 ks = F;
  // 能量守恒，总量减去反射量就是漫反射量，金属没有颜色，在用金属度进行处理
  vec3 kd = (1.0 - ks) * (1.0 - m);

  // 光辐射量
  float dis = length(lp - p);
  vec3 li = lc * (1.0 / (dis * dis));

  // 防止分母为0 + 上0.001
  vec3 specular = (D * F * G) / (4.0 * dotVN * dotNL + 0.0001);
  return (kd * c / PI + specular) * li * dotNL;
}

#define NUM_LIGHT 4
#define GAMMA 2.2

uniform vec3 lightPositions[NUM_LIGHT];
uniform vec3 lightColors[NUM_LIGHT];
uniform vec3 viewPos;

uniform samplerCube irradianceMap;
uniform vec3 albedo;
uniform float ao;
uniform float metallic;
uniform float roughness;

in vec3 vFragPosition;
in vec3 vNormal;
in vec2 vTexcoord;
out vec4 oFragColor;

void main(){
  vec3 viewDire = normalize(viewPos - vFragPosition);
  vec3 nor = normalize(vNormal);

  vec3 lo = vec3(0);
  for (int i = 0; i < NUM_LIGHT; i++) {
    lo += getLightOut(
      vFragPosition,
      albedo,
      nor,
      viewDire,
      normalize(lightPositions[i] - vFragPosition),
      lightPositions[i],
      viewPos,
      lightColors[i],
      roughness,
      metallic
    );
  }

  
  vec3 irradiance = texture(irradianceMap, nor).rgb;
  vec3 ks = FSchlickRoughness(
    max(dot(nor, viewDire), 0.0), 
    albedo, 
    metallic, 
    roughness
  );
  vec3 kd = 1.0 - ks;
  vec3 ambient = kd * albedo * irradiance * ao;
  vec3 color = ambient + lo;
  color /= (color + 1.);
  color = pow(color, vec3(1. / GAMMA));
  oFragColor = vec4(color, 1);
}
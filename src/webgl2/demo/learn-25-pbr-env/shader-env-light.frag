#version 300 es
precision mediump float;

#define PI 3.14159265359

uniform sampler2D envTex;

in vec4 vLocPosition;

const vec2 invAtan = vec2(1.0 / (PI * 2.0), -1.0 / PI);
vec2 getSphereUV(vec3 v) {
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan; 
    uv += 0.5;
    uv = mod(uv, 1.0);
    return uv;
}

vec3 getPositionColor(vec3 nor) {
  vec2 uv = getSphereUV(vec3(nor.xy, nor.z));
  return texture(envTex, uv).rgb;
}

const vec3 UP = vec3(0, 1, 0);
out vec4 vFragColor;
void main(){
  vec3 nor = normalize(vLocPosition.xyz / vLocPosition.w);
  vec3 right = normalize(cross(UP, nor));
  vec3 up = normalize(cross(nor, right ));

  float itemAmount = 0.025;
  float numItem = 0.0;
  vec3 total = vec3(0, 0, 0);
  // 构建半球领域，
  // 俯仰视角 [0, PI/2]
  for (float pitch = 0.0; pitch < PI / 2.0; pitch+= itemAmount) {
    // 偏航角[-PI, PI]
    for (float yaw = 0.0; yaw < 2.0 * PI; yaw+= itemAmount) {
      float cosYaw = cos(yaw);
      float sinYaw = sin(yaw);
      float cosPitch = cos(pitch);
      float sinPitch = sin(pitch);
      vec3 pv = vec3(sinPitch * cosYaw, sinPitch * sinYaw, cosPitch);
      // 转到切线空间
      vec3 pos = pv.x * right + pv.y * up + pv.z * nor;
      total += getPositionColor(normalize(pos)) * cosPitch * sinPitch;
      numItem++;
    }
  }
  vFragColor = vec4(PI * total * (1.0 / float(numItem)), 1);
}
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

out vec4 vFragColor;
void main(){
  vec2 uv = getSphereUV(normalize(vLocPosition.xyz / vLocPosition.w));
  vec3 color = texture(envTex, uv).rgb;
  // color /= color + 1.0;
  vFragColor = vec4(color, 1);
}
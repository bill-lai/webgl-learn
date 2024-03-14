#version 300 es
precision mediump float;

uniform vec3 color;
layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 lightColor;
void main(){
  fragColor = vec4(color, 1);
  
  // 判断如果颜色超过一定亮度就认为要发光晕
  if (dot(color, vec3(0.2126, 0.7152, 0.0722)) > 0.5) {
    lightColor = vec4(color, 1);
  } else {
    lightColor = vec4(0, 0, 0, 1);
  }
}
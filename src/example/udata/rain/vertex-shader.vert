attribute float vertexId;

uniform float sumVerts;
uniform float dateTime;

// 伪随机数
float hash(float p) {
  vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
  p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
  return fract(p2.x * p2.y * 95.4337);
}

vec2 getPosition(float step, float time) {
  // float x = step * 2.0 - 1.0;
  // float x = hash(step) * 2.0 - 1.0;

  float inc = floor(time / 3.0); // 3秒变一次x
  float x = hash(step + inc) * 2.0 - 1.0;
  float y = fract(step + time) * -2.0 + 1.0;

  return vec2(x, y);
}


void main(){
  vec2 position = getPosition((vertexId + 0.5) / sumVerts, dateTime);

  gl_Position = vec4(position, 0, 1);
  gl_PointSize = 4.0;
}
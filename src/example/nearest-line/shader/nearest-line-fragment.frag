precision highp float;

uniform sampler2D u_pointsTex;
uniform vec2 u_pointsTexSize;

uniform sampler2D u_linesTex;
uniform vec2 u_linesTexSize;

vec4 getTexData(sampler2D tex, vec2 size, float index) {
  float su = mod(index, size.x) + 0.5;
  float sv = floor(index / size.x) + 0.5;
  vec2 uv = vec2(su, sv) / size;
  return texture2D(tex, uv);
}

// 获取点到线的长度，a为点  bc为线段
float getDistanceFormPointToLine(in vec3 a, in vec3 b, in vec3 c) {
  vec3 ba = a - b;
  vec3 bc = c - b;
  float d = dot(ba, bc);
  float len = length(bc);
  float param = 0.0;

  if (len != 0.0) {
    param = clamp(d / (len * len), 0.0, 1.0);
  }

  vec3 r = b + bc * param;
  return distance(a, r);
}

// gl_FragCoord是在像素中心的，比如开始点为 0.5 0.5
// 这里只计算数据，所以渲染尺寸跟pointsTex尺寸一致
void main(){
  float pndx = floor(gl_FragCoord.y) * u_pointsTexSize.x + floor(gl_FragCoord.x);

  float minDist = 1000000.0;
  float minIndex = 8.0;
  vec3 point = vec3(getTexData(u_pointsTex, u_pointsTexSize, pndx).xy, 0);

  for (int i = 0; i < 100; i++) {
    vec3 start = vec3(getTexData(u_linesTex, u_linesTexSize, float(i * 2)).xy, 0);
    vec3 end = vec3(getTexData(u_linesTex, u_linesTexSize, float(i * 2 + 1)).xy, 0);
    float dist = getDistanceFormPointToLine(point, start, end);
    if (dist < minDist) {
      minDist = dist;
      minIndex = float(i);
    }
  }

  // minIndex = point.x;
  // 因为gl_FragColor每个通道只有8位，我们可以分开通道存储，然后在外面使用时在拼接这样就有32位了
  gl_FragColor = vec4(
    mod(minIndex, 256.0),
    mod(floor(minIndex / 256.0), 256.0),
    mod(floor(minIndex / (256.0 * 256.0)), 256.0),
    floor(minIndex / (256.0 * 256.0 * 256.0))
  ) / 255.0;
}
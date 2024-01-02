attribute float a_vertexId;

uniform float u_sliceSubVerts;
uniform float u_sumVerts;
uniform vec2 u_resolution;

#define PI radians(180.0);

vec2 getPosition(float cstep, float radius) {
  float angle = cstep * 2.0 * PI;
  return vec2(cos(angle), sin(angle)) * radius;
}

vec2 getCirclePosition(float numVertes, float vertexId, float radius) {
  float numSlices = numVertes / 3.0;
  float sliceId = floor(vertexId / 3.0);
  float triId = mod(vertexId, 3.0);
  // 让第二个点半径为0 step 第一个大于第二个返回0 否则返回1
  float radiusStep = step(triId, 1.5);
  vec2 position = getPosition((sliceId + triId) / numSlices, radius * radiusStep);
  return position;
}

void main(){
  float centerStep = floor(a_vertexId / u_sliceSubVerts) / ( u_sumVerts / u_sliceSubVerts);
  vec2 center = getPosition(centerStep, 0.8);

  float clipId = mod(a_vertexId, u_sliceSubVerts);
  vec2 clipPos = getCirclePosition(u_sliceSubVerts, clipId, 0.1);

  vec2 position = center + clipPos;
  vec2 scale = vec2(u_resolution.y / u_resolution.x, 1);
  gl_Position = vec4(position * scale, 0, 1);
  gl_PointSize = 5.0;
}
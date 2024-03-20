#version 300 es
precision mediump float;

#define NUM_KERNEL 64

uniform sampler2D fragPositionTex;
uniform sampler2D normalTex;
uniform sampler2D noiseTex;
uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform vec2 screenSize;
uniform vec3 kernels[NUM_KERNEL];
uniform float ssaoRadius;

in vec2 vTexcoord;
out vec4 oFragColor;

void main(){
  vec2 noiseScale = screenSize / vec2(textureSize(noiseTex, 0));

  // 利用nose和normal构建切线空间
  vec3 normal = texture(normalTex, vTexcoord).xyz;
  vec3 randVec = texture(noiseTex, vTexcoord * noiseScale).xyz;
  vec3 tangent = normalize(randVec - (normal * dot(randVec, normal)));
  vec3 bitangent = cross(normal, tangent);
  mat3 tbn = mat3(tangent, bitangent, normal);
  mat3 cViewMat = mat3(viewMat);

  vec3 fragPosition = texture(fragPositionTex, vTexcoord).xyz;
  float occlusion = 0.;
  // 将采样点转到世界坐标
  for (int i = 0; i < NUM_KERNEL; i++) {
    vec3 simple = fragPosition + cViewMat * ((tbn * kernels[i]) * ssaoRadius);
    vec4 clip = projectionMat * vec4(simple, 1);
    clip.xyz = (clip.xyz / clip.w) * 0.5 + 0.5;

    // 获取当前深度，和模型深度
    float kernelDepth = simple.z;
    float simpleDepth = -texture(fragPositionTex, clip.xy).w;
    // 遮挡量
    float kernelOcclusion = simpleDepth - kernelDepth >= 0.05 ? 1. : 0.;
    // 确保只有半径内的影响到遮盖
    float rangeTest = smoothstep(0., 1., ssaoRadius / abs(fragPosition.z - simpleDepth));
    occlusion += kernelOcclusion * rangeTest;
  };
  occlusion = 1. - occlusion / float(NUM_KERNEL);

  oFragColor = vec4(occlusion, occlusion, occlusion, 1);
}
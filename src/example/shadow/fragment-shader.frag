precision mediump float;

uniform vec4 u_lightColor;
uniform vec4 u_mutColor;
uniform float u_lightAngleOuter;
uniform float u_lightAngleInner;
uniform float u_shininess;
uniform float u_ambient;
uniform vec3 u_lightDirection;
uniform sampler2D u_texture;
uniform sampler2D u_lightDepthTexture;

varying vec3 v_normal;
varying vec2 v_texcoord;
varying vec4 v_lightProjectionPosition;
varying vec3 v_lightToFaceDirection;
varying vec3 v_cameraToFaceDirection;

void main() {
  vec3 lightToFaceDirection = normalize(v_lightToFaceDirection);
  vec3 cameraToFaceDirection = normalize(v_cameraToFaceDirection);
  vec3 normal = normalize(v_normal);

  // 计算光强度。使用射灯
  // 是否在光照内
  float lightRange = smoothstep(
    u_lightAngleOuter, 
    u_lightAngleInner, 
    dot(u_lightDirection, lightToFaceDirection)
  );
  float lightWeight = dot(-lightToFaceDirection, normal) * lightRange;

  // 计算反射光强度
  vec3 halfVector = normalize(-lightToFaceDirection - cameraToFaceDirection);
  float specluarWeight = lightRange * pow(dot(halfVector, normal), u_shininess);

  // 计算阴影颜色
  vec3 lightProjectionPosition = v_lightProjectionPosition.xyz / v_lightProjectionPosition.w;

  // 计算深度是否在阴影内
  float depth = texture2D(u_lightDepthTexture, lightProjectionPosition.xy).r;
  bool inLightInner = lightProjectionPosition.x >= 0.0 &&
    lightProjectionPosition.x <= 1.0 &&
    lightProjectionPosition.y >= 0.0 &&
    lightProjectionPosition.y <= 1.0 ;
  float depthDiff = lightProjectionPosition.z - depth;
  float shadowLight = (inLightInner && depthDiff >= 0.06) ? 0.0 : 1.0;

  // 贴图原色
  vec4 color = texture2D(u_texture, v_texcoord) * u_mutColor;
  gl_FragColor = vec4(
    color.rgb * lightWeight * shadowLight + 
    specluarWeight * shadowLight + 
    color.rgb * u_ambient,
    color.a
  );
}
#version 300 es
precision mediump float;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 ambientColor;
uniform mat4 normalMatrix;
uniform sampler2D normalMap;
uniform sampler2D specularFactorMap;
uniform sampler2D diffuseMap;

in vec2 v_texcoord;
in vec3 v_position;
in vec3 v_normal;

// 计算上一个位置纹理值与当前值差异
vec2 dHdxyFwd(sampler2D bumpMap, vec2 uv, float bumpScale) {
  // 拿到上一个X,和上一个Y，的差异uv坐标
  vec2 puvx = dFdx(uv);
  vec2 puvy = dFdy(uv);

  float cur = texture(bumpMap, uv).x;
  return vec2(
    texture(bumpMap, uv + puvx).x - cur,
    texture(bumpMap, uv + puvy).x - cur
  ) * bumpScale;
}

// 扰动函数，因为向量是顶点着色器通过贴图加的，可能出现突然拔高的清空，向量可能不对，小对差异大的进行扰动
vec3 pertubNormalArb(vec3 pos, vec3 normal, vec2 dHdxy) {
  // 左边坐标与当前差值
  vec3 pdPosx = vec3( dFdx(pos.x), dFdx(pos.y), dFdx(pos.z) );
  // 上边坐标与当前差值
  vec3 pdPosy = vec3( dFdy(pos.x), dFdy(pos.y), dFdy(pos.z) );

  // 左边差值与当前法向量的互垂线
  vec3 R1 = cross(pdPosy, normal);
  // 上边差值与当前法向量的互垂线
  vec3 R2 = cross(normal, pdPosx);
  // 上差值互垂线与左差值cos角度
  float det = dot(pdPosx, R1);

  // 正反面转换到 [-1, 1] * cos角度值
  det *= float(gl_FrontFacing) * 2. - 1.;
  // sign 小于0转到-1 等于0 转到0 大于0转到1
  // 法线差值分别与垂线叉乘
  vec3 grad = sign(det) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(det) * normal - grad);
}

out vec4 fColor;
void main(){
  vec3 lightDirection = normalize(v_position - lightPosition);
  vec3 eyeDirection = normalize(-v_position);
  vec3 normal = normalize(v_normal);
  float lightAmount = mix(0., 1., dot(-lightDirection, normal));

  normal = pertubNormalArb(
    v_position, 
    normal, 
    dHdxyFwd(normalMap, v_texcoord, 1.1)
  );

  float specularFactor = texture(specularFactorMap, v_texcoord).r;
  float specularAmount = dot(reflect(lightDirection, normal), eyeDirection);
  specularAmount = specularAmount > 0. ? specularFactor * pow(specularAmount, 5.0) : 0.;

  vec4 diffuse = texture(diffuseMap, v_texcoord);
  vec3 lightDiffuse = lightAmount * lightColor * diffuse.rgb;
  vec3 diffuseBump = min(lightDiffuse + dot(normal, -lightDirection), 1.1);

  vec3 color = lightDiffuse * diffuseBump + 
    diffuse.rgb * ambientColor +
    specularAmount * vec3(1, 1, 1);

  fColor = vec4(color, 1);
}
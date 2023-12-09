precision mediump float;

uniform vec3 u_lightDirection;
// 漫射光
uniform vec3 diffuse;
// 环境光照射下的颜色
uniform vec3 ambient;
// 反射光
uniform vec3 specular;
// 自身光
uniform vec3 emissive;
// 环境光颜色
uniform vec3 u_ambientLight;
// 透明度
uniform float opacity;
uniform float shininess;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D specularMap;

varying vec3 v_normal;
varying vec4 v_color;
varying vec3 v_cameraToFace;
varying vec2 v_texcoord;
varying vec3 v_tangent;

void main(){
  vec3 normal = normalize(v_normal);
  vec3 tangent = normalize(v_tangent);
  vec3 cameraToFace = normalize(v_cameraToFace);

  // 使用法线切线，使模型更有质感，使用法线贴图来改变法线方向
  // gl_FrontFacing 内建变量，表示当前绘画的是正面还是逆面 使正面为1 逆面为-1
  float frontFacing = float(gl_FrontFacing) * 2.0 - 1.0;
  normal = normal * frontFacing;
  tangent = tangent * frontFacing;
  // 得到副切线
  vec3 bitTangent = normalize(cross(normal, tangent));
  // 通过切线，副切线，法线可以构成矩阵，这个矩阵能将法线贴图的法线向量转换到世界空间
  mat3 tbn = mat3(tangent, bitTangent, normal);
  // 拿到贴图值，转为[-1, 1]之间的法线
  normal = texture2D(normalMap, v_texcoord).rgb * 2.0 - 1.0;
  // 将法线向量转为为世界空间
  normal = normalize(tbn * normal);

  // normal = normalize(v_normal);


  // 最少亮一半
  float lightWeight = dot(-u_lightDirection, normal) * .5 + .5;
  vec3 halfVert = normalize(-u_lightDirection - cameraToFace);
  float specluarWeight = clamp(dot(normal, halfVert), 0.0, 1.0);
  
  vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);

  vec4 specularMapColor = texture2D(specularMap, v_texcoord);


  vec3 color = 
    v_color.rgb * diffuse * diffuseMapColor.rgb * lightWeight + 
    u_ambientLight * ambient +
    specular * specularMapColor.rgb * pow(specluarWeight, shininess) +
    emissive;
  
  gl_FragColor = vec4(color, v_color.a * opacity * diffuseMapColor.a);
}
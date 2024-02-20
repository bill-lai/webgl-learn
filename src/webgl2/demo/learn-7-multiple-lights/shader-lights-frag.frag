#version 300 es
precision mediump float;

struct Material {
  sampler2D diffuseTex;
  sampler2D specluarTex;
  sampler2D emissionTex;
  float shininess;
};

struct DirectionLight {
  vec3 direction;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;
};

struct DotLight {
  vec3 position;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;

  float constant;
  float linear;
  float quadratic;
};

// 手电筒
struct SpotLight {
  vec3 position;
  vec3 direction;
  vec3 ambient;
  vec3 diffuse;
  vec3 specluar;

  float cutOff;
  float outerOff;

  float constant;
  float linear;
  float quadratic;
};

// 获取光强度
float getATT(
  vec3 fragPosition,
  vec3 lightPosition,
  float lightConstant,
  float lightLinear,
  float lightQuadratic
) {
  float d = length(fragPosition - lightPosition);
  return 1. / (lightConstant + d * lightLinear + lightQuadratic * pow(d, 2.));
}

// 获取光照射下颜色
vec3 getLightEffectColor(
  in Material material,
  in vec2 texcoord,
  in vec3 lightDire,
  in vec3 eysDire,
  in vec3 nor,
  in vec3 lightAmbient,
  in vec3 lightDiffuse,
  in vec3 lightSpecluar
) {
  vec3 diffuseTexColor = texture(material.diffuseTex, texcoord).xyz;
  vec3 emissionTexColor = texture(material.emissionTex, texcoord).xyz;
  vec3 specluarTexColor = texture(material.specluarTex, texcoord).xyz;

  vec3 ldiffuseColor = max(dot(-lightDire, nor), 0.) * lightDiffuse;
  vec3 lspecluarColor = pow(max(dot(reflect(lightDire, nor), -eysDire), 0.), material.shininess) * lightSpecluar;

  return (ldiffuseColor + lightAmbient) * diffuseTexColor + 
    lspecluarColor * specluarTexColor +
    emissionTexColor;
}


uniform Material material;
uniform DirectionLight directionLight;
#define NUM_DOT_LIGHT 4
uniform DotLight dotLights[NUM_DOT_LIGHT];
uniform SpotLight spotLight;
uniform vec3 eysDire;
uniform sampler2D diffuseSpotTex;

in vec2 vTexcoord;
in vec3 vNormal;
in vec3 vFragPosition;
in vec2 vSpotTexcoord;


out vec4 fragColor;

void main(){
  vec3 nor = normalize(vNormal);
  vec3 direLightColor = getLightEffectColor(
    material, 
    vTexcoord,
    directionLight.direction,
    eysDire,
    nor,
    directionLight.ambient,
    directionLight.diffuse,
    directionLight.specluar
  );

  vec3 dotLightColor = vec3(0, 0, 0);
  for (int i = 0; i < NUM_DOT_LIGHT; i++) {
    DotLight dl = dotLights[i];
    float att = getATT(
      vFragPosition, 
      dl.position, 
      dl.constant, 
      dl.linear, 
      dl.quadratic
    );

    dotLightColor += getLightEffectColor(
      material,
      vTexcoord,
      normalize(vFragPosition - dl.position),
      eysDire,
      nor,
      dl.ambient * att,
      dl.diffuse * att,
      dl.specluar * att
    );
  }

  float spotLenAtt = getATT(
    vFragPosition, 
    spotLight.position, 
    spotLight.constant, 
    spotLight.linear, 
    spotLight.quadratic
  );
  spotLenAtt = 1.;
  vec3 lightToFrag = normalize(vFragPosition - spotLight.position);
  float theta = dot(spotLight.direction, lightToFrag);
  float att = spotLenAtt * clamp((theta - spotLight.outerOff) / (spotLight.cutOff - spotLight.outerOff), 0., 1.);
  vec3 spotLightColor = getLightEffectColor(
    material,
    vTexcoord,
    lightToFrag,
    eysDire,
    nor,
    spotLight.ambient * att,
    spotLight.diffuse * att,
    spotLight.specluar * att
  );
  // spotLightColor = vec3(1, 1, 1);
  spotLightColor *= texture(diffuseSpotTex, vSpotTexcoord).rgb;
  
  
  // fragColor = vec4(spotLightColor, 1);
  // fragColor = vec4(vSpotTexcoord, 0, 1);

  // fragColor = vec4(spotLightColor, 1);
  // fragColor = vec4(direLightColor + spotLightColor, 1);
  fragColor = vec4(direLightColor + dotLightColor + spotLightColor, 1);
}
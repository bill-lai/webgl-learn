#version 300 es
precision mediump float;

struct Material {
  sampler2D diffuseTex;
  sampler2D specluarTex;
  sampler2D emissionTex;
  vec3 diffuse;
  vec3 specular;
  vec3 emissive;
  float shininess;
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
  vec3 diffuseTexColor = texture(material.diffuseTex, texcoord).rgb + material.diffuse;
  vec3 specluarTexColor = texture(material.specluarTex, texcoord).rgb + material.specular;
  vec3 emissionTexColor = texture(material.emissionTex, texcoord).rgb + material.emissive; 

  vec3 ldiffuseColor = max(dot(-lightDire, nor), 0.) * lightDiffuse;
  vec3 lspecluarColor = pow(max(dot(reflect(lightDire, nor), -eysDire), 0.), material.shininess) * lightSpecluar;

  return (ldiffuseColor + lightAmbient) * diffuseTexColor + 
    lspecluarColor * specluarTexColor +
    emissionTexColor;
}

#define NUM_DOT_LIGHT 2

uniform DotLight dotLights[NUM_DOT_LIGHT];
uniform Material material;
uniform vec3 eysPosition;
uniform bool isOutline;
uniform vec3 outlineColor;

in vec2 vTexcoord;
in vec3 vNormal;
in vec3 vFragPosition;

out vec4 fragColor;

void main(){
  if (isOutline) {
    fragColor = vec4(outlineColor, 1);
  } else {
    vec3 nor = normalize(vNormal);
    vec3 eysDire = normalize(vFragPosition - eysPosition);

    vec3 effectColor = vec3(0, 0, 0);
    for (int i = 0; i < NUM_DOT_LIGHT; i++) {
      DotLight dl = dotLights[i];
      float att = getATT(
        vFragPosition, 
        dl.position, 
        dl.constant, 
        dl.linear, 
        dl.quadratic
      );

      effectColor += getLightEffectColor(
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

    fragColor = vec4(effectColor, 1);
  }

  // float near = 0.1; 
  // float far  = 100.0; 
  // float z = gl_FragCoord.z * 2.0 - 1.0; // back to NDC 
  // float depth = (2.0 * near * far) / (far + near - z * (far - near));    
  // fragColor = vec4(vec3(depth), 1);
}
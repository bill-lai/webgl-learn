precision mediump float;

uniform sampler2D texture;
uniform vec4 mutColor;
uniform float shininess;
uniform vec4 specular;
uniform float specularFactor;
uniform vec4 lightColor;

varying vec2 v_texcoord;
varying vec3 v_lightToMeshDirection;
varying vec3 v_cameraToMeshDirection;
varying vec3 v_normal;

void main(){
  vec3 normal = normalize(v_normal);
  vec3 lightToMeshDirection = normalize(v_lightToMeshDirection);
  vec3 cameraToMeshDirection = normalize(v_cameraToMeshDirection);

  float lightWeight = abs(dot(-lightToMeshDirection, normal));
  float specularWeight = dot(
    normalize(-lightToMeshDirection - cameraToMeshDirection),
    normal
  );
  specularWeight = specularWeight > 0.0 ? pow(specularWeight, shininess) : 0.0;
  
  gl_FragColor = mutColor * texture2D(texture, v_texcoord);
  gl_FragColor.rgb *= lightWeight;
  gl_FragColor.rgb += specular.rgb * specularFactor * specularWeight;
  gl_FragColor *= lightColor;
}

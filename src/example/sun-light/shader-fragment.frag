
uniform sampler2D texDay;
uniform sampler2D texNight;
uniform vec3 sunDirection;

varying vec2 vUv;
varying vec3 vNormal;

void main(){
  vec3 dayColor = texture2D(texDay, vUv).rgb;
  vec3 nightColor = texture2D(texNight, vUv).rgb;
  float lightWeight = dot(normalize(vNormal), sunDirection);

  lightWeight = clamp(lightWeight * 10.0, -1., 1.) * .5 + .5;
  vec3 color = mix(nightColor, dayColor, lightWeight);

  gl_FragColor = vec4(color, 1);
}
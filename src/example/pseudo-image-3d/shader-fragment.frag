precision mediump float;

uniform float time;
uniform float range;
uniform float mixAmount;
uniform vec2 mouse;
// 是否作用，r偏移通道， g扭曲通道，越大作用越多   
uniform sampler2D texEffectMap;
uniform sampler2D texture;
uniform sampler2D texBlur;

varying vec2 v_texcoord;

void main(){
  vec2 offset = vec2(sin(time + v_texcoord.y * range), 0) * mixAmount;
  vec4 effectData = texture2D(texEffectMap, v_texcoord);
  float offsetMult = effectData.g;
  float parallaxMult = 0.5 - effectData.r;
  vec2 uv = v_texcoord + offset * offsetMult + mouse * parallaxMult;
  vec4 original = texture2D(texture, uv);
  vec4 blurred = texture2D(texBlur, uv);
  
  
  
  gl_FragColor = mix(original, blurred, length(offset * offsetMult / range));
}


#extension GL_EXT_frag_depth : require
precision highp float;

uniform sampler2D deptTex;
uniform sampler2D colorTex;
uniform float depthOffset;
uniform float depthScale;

varying vec2 v_texcoord;


void main(){
  vec4 color = texture2D(colorTex, v_texcoord);
  if (color.a < 0.01) {
    discard;
  } else {
    gl_FragColor = color;
    float depth = texture2D(deptTex, v_texcoord).r;
    // depth越大就距离距离屏幕越近
    //
    gl_FragDepthEXT = depthOffset - depth * depthScale;
  }
}
precision mediump float;

// w实现可变量模板差值，所以不要变动w  还有纹理透射也用到w
varying vec4 v_color;

void main(){
  gl_FragColor = v_color;
}
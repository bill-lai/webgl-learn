precision mediump float;

uniform sampler2D u_tex;

// pointCoord是一个特殊变了，能获取点的纹理坐标范围在[0,1]表示绘制点的纹理坐标
void main(){
  gl_FragColor = texture2D(u_tex, gl_PointCoord);
  // gl_FragColor = vec4(0, 0, 0, 1)
}
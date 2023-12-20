attribute vec4 a_position;
attribute vec4 a_normal;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_woldMatrix;

varying vec4 v_worldPosition;
varying vec4 v_normal;

void main(){
  v_worldPosition = u_woldMatrix * a_position;
  v_normal = u_woldMatrix * a_normal;

  gl_Position = u_projectionMatrix * u_viewMatrix * v_worldPosition;
}
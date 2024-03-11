#version 300 es
precision mediump float;

// float linearizeDepth(float depth) {
//   float near_plane = 0.1;
//   float far_plane = 100.0;
//   float z = depth * 2.0 - 1.0; // Back to NDC 
//   return (2.0 * near_plane * far_plane) / (far_plane + near_plane - z * (far_plane - near_plane));
// }

void main(){
  gl_FragDepth = gl_FragCoord.z;
}
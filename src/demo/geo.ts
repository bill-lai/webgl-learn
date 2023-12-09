
export const getF3DGeometry = () =>
  new Float32Array([
    // left column front
    0,   0,  0,
    0, 150,  0,
    30,   0,  0,
    0, 150,  0,
    30, 150,  0,
    30,   0,  0,

    // top rung front
    30,   0,  0,
    30,  30,  0,
    100,   0,  0,
    30,  30,  0,
    100,  30,  0,
    100,   0,  0,

    // middle rung front
    30,  60,  0,
    30,  90,  0,
    67,  60,  0,
    30,  90,  0,
    67,  90,  0,
    67,  60,  0,

    // left column back
      0,   0,  30,
     30,   0,  30,
      0, 150,  30,
      0, 150,  30,
     30,   0,  30,
     30, 150,  30,

    // top rung back
     30,   0,  30,
    100,   0,  30,
     30,  30,  30,
     30,  30,  30,
    100,   0,  30,
    100,  30,  30,

    // middle rung back
     30,  60,  30,
     67,  60,  30,
     30,  90,  30,
     30,  90,  30,
     67,  60,  30,
     67,  90,  30,

    // top
      0,   0,   0,
    100,   0,   0,
    100,   0,  30,
      0,   0,   0,
    100,   0,  30,
      0,   0,  30,

    // top rung right
    100,   0,   0,
    100,  30,   0,
    100,  30,  30,
    100,   0,   0,
    100,  30,  30,
    100,   0,  30,

    // under top rung
    30,   30,   0,
    30,   30,  30,
    100,  30,  30,
    30,   30,   0,
    100,  30,  30,
    100,  30,   0,

    // between top rung and middle
    30,   30,   0,
    30,   60,  30,
    30,   30,  30,
    30,   30,   0,
    30,   60,   0,
    30,   60,  30,

    // top of middle rung
    30,   60,   0,
    67,   60,  30,
    30,   60,  30,
    30,   60,   0,
    67,   60,   0,
    67,   60,  30,

    // right of middle rung
    67,   60,   0,
    67,   90,  30,
    67,   60,  30,
    67,   60,   0,
    67,   90,   0,
    67,   90,  30,

    // bottom of middle rung.
    30,   90,   0,
    30,   90,  30,
    67,   90,  30,
    30,   90,   0,
    67,   90,  30,
    67,   90,   0,

    // right of bottom
    30,   90,   0,
    30,  150,  30,
    30,   90,  30,
    30,   90,   0,
    30,  150,   0,
    30,  150,  30,

    // bottom
    0,   150,   0,
    0,   150,  30,
    30,  150,  30,
    0,   150,   0,
    30,  150,  30,
    30,  150,   0,

    // left side
    0,   0,   0,
    0,   0,  30,
    0, 150,  30,
    0,   0,   0,
    0, 150,  30,
    0, 150,   0]);

export const getF3DColorGeometry = () => new Uint8Array([
  // left column front
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,

  // top rung front
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,

  // middle rung front
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,
200,  70, 120,

  // left column back
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,

  // top rung back
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,

  // middle rung back
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,
80, 70, 200,

  // top
70, 200, 210,
70, 200, 210,
70, 200, 210,
70, 200, 210,
70, 200, 210,
70, 200, 210,

  // top rung right
200, 200, 70,
200, 200, 70,
200, 200, 70,
200, 200, 70,
200, 200, 70,
200, 200, 70,

  // under top rung
210, 100, 70,
210, 100, 70,
210, 100, 70,
210, 100, 70,
210, 100, 70,
210, 100, 70,

  // between top rung and middle
210, 160, 70,
210, 160, 70,
210, 160, 70,
210, 160, 70,
210, 160, 70,
210, 160, 70,

  // top of middle rung
70, 180, 210,
70, 180, 210,
70, 180, 210,
70, 180, 210,
70, 180, 210,
70, 180, 210,

  // right of middle rung
100, 70, 210,
100, 70, 210,
100, 70, 210,
100, 70, 210,
100, 70, 210,
100, 70, 210,

  // bottom of middle rung.
76, 210, 100,
76, 210, 100,
76, 210, 100,
76, 210, 100,
76, 210, 100,
76, 210, 100,

  // right of bottom
140, 210, 80,
140, 210, 80,
140, 210, 80,
140, 210, 80,
140, 210, 80,
140, 210, 80,

  // bottom
90, 130, 110,
90, 130, 110,
90, 130, 110,
90, 130, 110,
90, 130, 110,
90, 130, 110,

  // left side
160, 160, 220,
160, 160, 220,
160, 160, 220,
160, 160, 220,
160, 160, 220,
160, 160, 220]);


export const getF3DTexcoordGeometry = () => new Float32Array([
  // left column front
  0, 0,
  0, 1,
  1, 0,
  0, 1,
  1, 1,
  1, 0,

  // top rung front
  0, 0,
  0, 1,
  1, 0,
  0, 1,
  1, 1,
  1, 0,

  // middle rung front
  0, 0,
  0, 1,
  1, 0,
  0, 1,
  1, 1,
  1, 0,

  // left column back
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1,

  // top rung back
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1,

  // middle rung back
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1,

  // top
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1,

  // top rung right
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1,

  // under top rung
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,

  // between top rung and middle
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // top of middle rung
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // right of middle rung
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // bottom of middle rung.
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,

  // right of bottom
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // bottom
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,

  // left side
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0

])

export const getF3DTexcoordGeometry1 = () => new Float32Array([
  // left column front
   38 / 255,  44 / 255,
   38 / 255, 223 / 255,
  113 / 255,  44 / 255,
   38 / 255, 223 / 255,
  113 / 255, 223 / 255,
  113 / 255,  44 / 255,

  // top rung front
  113 / 255, 44 / 255,
  113 / 255, 85 / 255,
  218 / 255, 44 / 255,
  113 / 255, 85 / 255,
  218 / 255, 85 / 255,
  218 / 255, 44 / 255,

  // middle rung front
  113 / 255, 112 / 255,
  113 / 255, 151 / 255,
  203 / 255, 112 / 255,
  113 / 255, 151 / 255,
  203 / 255, 151 / 255,
  203 / 255, 112 / 255,

  // left column back
   38 / 255,  44 / 255,
  113 / 255,  44 / 255,
   38 / 255, 223 / 255,
   38 / 255, 223 / 255,
  113 / 255,  44 / 255,
  113 / 255, 223 / 255,

  // top rung back
  113 / 255, 44 / 255,
  218 / 255, 44 / 255,
  113 / 255, 85 / 255,
  113 / 255, 85 / 255,
  218 / 255, 44 / 255,
  218 / 255, 85 / 255,

  // middle rung back
  113 / 255, 112 / 255,
  203 / 255, 112 / 255,
  113 / 255, 151 / 255,
  113 / 255, 151 / 255,
  203 / 255, 112 / 255,
  203 / 255, 151 / 255,

  // top
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1,

  // top rung right
  0, 0,
  1, 0,
  1, 1,
  0, 0,
  1, 1,
  0, 1,

  // under top rung
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,

  // between top rung and middle
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // top of middle rung
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // right of middle rung
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // bottom of middle rung.
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,

  // right of bottom
  0, 0,
  1, 1,
  0, 1,
  0, 0,
  1, 0,
  1, 1,

  // bottom
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,

  // left side
  0, 0,
  0, 1,
  1, 1,
  0, 0,
  1, 1,
  1, 0,
])

export const cubePostions = () => new Float32Array([
  -0.5, -0.5,  -0.5,
  -0.5,  0.5,  -0.5,
   0.5, -0.5,  -0.5,
  -0.5,  0.5,  -0.5,
   0.5,  0.5,  -0.5,
   0.5, -0.5,  -0.5,

  -0.5, -0.5,   0.5,
   0.5, -0.5,   0.5,
  -0.5,  0.5,   0.5,
  -0.5,  0.5,   0.5,
   0.5, -0.5,   0.5,
   0.5,  0.5,   0.5,

  -0.5,   0.5, -0.5,
  -0.5,   0.5,  0.5,
   0.5,   0.5, -0.5,
  -0.5,   0.5,  0.5,
   0.5,   0.5,  0.5,
   0.5,   0.5, -0.5,

  -0.5,  -0.5, -0.5,
   0.5,  -0.5, -0.5,
  -0.5,  -0.5,  0.5,
  -0.5,  -0.5,  0.5,
   0.5,  -0.5, -0.5,
   0.5,  -0.5,  0.5,

  -0.5,  -0.5, -0.5,
  -0.5,  -0.5,  0.5,
  -0.5,   0.5, -0.5,
  -0.5,  -0.5,  0.5,
  -0.5,   0.5,  0.5,
  -0.5,   0.5, -0.5,

   0.5,  -0.5, -0.5,
   0.5,   0.5, -0.5,
   0.5,  -0.5,  0.5,
   0.5,  -0.5,  0.5,
   0.5,   0.5, -0.5,
   0.5,   0.5,  0.5,
])

export const clipPositions = () => {
  const positions = [
    -1, -1, -1,  // 立方体的顶点
     1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
    -1, -1,  1,
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // 立方体的索引
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  return { positions: new Float32Array(positions), includes: new Uint16Array(indices) }
}

export const cameraPostions = () => {
  const positions = [
    -1, -1,  1,  // cube vertices
     1, -1,  1,
    -1,  1,  1,
     1,  1,  1,
    -1, -1,  3,
     1, -1,  3,
    -1,  1,  3,
     1,  1,  3,
     0,  0,  1,  // cone tip
  ];
  const indices = [
    0, 1, 1, 3, 3, 2, 2, 0, // cube indices
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 3, 7, 2, 6,
  ];
  // add cone segments
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3;
  const coneTipIndex =  coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // line from tip to edge
    indices.push(coneTipIndex, coneBaseIndex + i);
    // line from point on edge to next point on edge
    indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
  }

  return { positions: new Float32Array(positions), includes: new Uint16Array(indices) }
}

export const cubeTexcoord1 = () => new Float32Array([
  
  0, 0,
  0, 1,
  1, 0,
  0, 1,
  1, 1,
  1, 0,

  0, 0,
  0, 1,
  1, 0,
  1, 0,
  0, 1,
  1, 1,

  0, 0,
  0, 1,
  1, 0,
  0, 1,
  1, 1,
  1, 0,

  0, 0,
  0, 1,
  1, 0,
  1, 0,
  0, 1,
  1, 1,

  0, 0,
  0, 1,
  1, 0,
  0, 1,
  1, 1,
  1, 0,

  0, 0,
  0, 1,
  1, 0,
  1, 0,
  0, 1,
  1, 1,
])

export const cubeTexcoord = () => 
new Float32Array([
// select the top left image
0   , 0  ,
0   , 0.5,
0.25, 0  ,
0   , 0.5,
0.25, 0.5,
0.25, 0  ,
// select the top middle image
0.25, 0  ,
0.5 , 0  ,
0.25, 0.5,
0.25, 0.5,
0.5 , 0  ,
0.5 , 0.5,
// select to top right image
0.5 , 0  ,
0.5 , 0.5,
0.75, 0  ,
0.5 , 0.5,
0.75, 0.5,
0.75, 0  ,
// select the bottom left image
0   , 0.5,
0.25, 0.5,
0   , 1  ,
0   , 1  ,
0.25, 0.5,
0.25, 1  ,
// select the bottom middle image
0.25, 0.5,
0.25, 1  ,
0.5 , 0.5,
0.25, 1  ,
0.5 , 1  ,
0.5 , 0.5,
// select the bottom right image
0.5 , 0.5,
0.75, 0.5,
0.5 , 1  ,
0.5 , 1  ,
0.75, 0.5,
0.75, 1  ,

])
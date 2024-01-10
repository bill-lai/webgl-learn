precision highp float;

uniform sampler2D tilemap;
uniform sampler2D tile;
uniform vec2 tilemapSize;
uniform vec2 tileSize;
uniform vec2 tileSimpleSize;

varying vec2 v_texcoord;

bool existsFlag(float flags, float flag) {
  return step(flag, mod(flags, flag + 1.0)) == 1.0;
}

void main(){
  // [0, 1]
  vec2 mapTexcoord = v_texcoord * tilemapSize;
  vec2 tilemapTexcoord = (floor(mapTexcoord) + vec2(0.5, 0.5)) / tilemapSize;

  vec4 map = texture2D(tilemap, tilemapTexcoord) * 255.0;
  vec2 tileTexcoord = fract(mapTexcoord);
  

  // y翻转
  if (existsFlag(map.a, 1.0)) {
    tileTexcoord.y = 1.0 - tileTexcoord.y;
  }
  // x翻转
  if (existsFlag(map.a, 2.0)) {
    tileTexcoord.x = 1.0 - tileTexcoord.x;
  }
  // xy对调
  if (existsFlag(map.a, 4.0)) {
    tileTexcoord.xy = tileTexcoord.yx;
  }

  tileTexcoord = ((map.xy + tileTexcoord) * tileSimpleSize) / tileSize;
  gl_FragColor = texture2D(tile, tileTexcoord);
}
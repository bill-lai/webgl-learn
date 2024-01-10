import { rand } from "../util";

export const tileSize = [256, 256]

export const generateTile = (text: string) => {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.canvas.width = tileSize[0];
  ctx.canvas.height = tileSize[1];
  ctx.font = `bold 16px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const color = `hsl(${rand(360) | 0},${rand(50, 100)}%,50%)`;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, tileSize[0], tileSize[1]);
  ctx.fillStyle = "#FFF";
  ctx.fillText(text, tileSize[0] * 0.5, tileSize[1] * 0.5);

  return new Promise<Uint8Array>((resolve, reject) => {
    const image = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    resolve(new Uint8Array(image.data.buffer))
  });
};

// level: [1-5]
// center: [1, 2]
export type TileData = { x: number; y: number; nx: number, ny: number, text: string };
export const getTilesData = (
  level: number,
  center: number[],
  clientBound: number[]
) => {
  const num = [
    Math.ceil(clientBound[0] / tileSize[0]),
    Math.ceil(clientBound[1] / tileSize[1]),
  ];
  const tileRang = Math.pow(2, 10 - level);
  const offset = [
    Math.floor(Math.ceil((center[0] + 1) / tileRang) - num[0] / 2),
    Math.floor(Math.ceil((center[1] + 1) / tileRang) - num[1] / 2),
  ];
  const tileStrs = new Array(tileRang).fill(0);
  const tilesData: TileData[] = [];

  for (let nx = 0; nx < num[0]; nx++) {
    for (let ny = 0; ny < num[1]; ny++) {
      const x = (offset[0] + nx) * tileRang;
      const y = (offset[1] + ny) * tileRang;
      const text =
        `x: ` +
        tileStrs.map((_, i) => i + x).join(",") +
        ` y: ` +
        tileStrs.map((_, i) => i + y).join(",");
      tilesData.push({ 
        x, 
        y, 
        nx,
        ny,
        text 
      });
    }
  }
  return tilesData;
};

type TileCacheValue = { use: number, prevUseTime: number } & (
  | {
      type: 0;
      data: Promise<Uint8Array>;
    }
  | {
      type: 1;
      data: Uint8Array;
    }
);
const tileCache: { [key in string]: TileCacheValue } = {};
const leastUsedDelete = () => {
  const keys = Object.keys(tileCache);
  if (keys.length < 500) {
    return;
  }
  keys
    .sort((a, b) => {
      const time = tileCache[a].prevUseTime - tileCache[a].prevUseTime
      if (time < 1000) {
        return tileCache[a].use - tileCache[a].use
      } else {
        return time;
      }
    })
    .slice(0, 100)
    .forEach(key => delete tileCache[key])
}

export const getTile = (tile: TileData) => {
  const key = `${tile.x}${tile.y}${tile.text}`;
  if (tileCache[key]) {
    tileCache[key].prevUseTime = Date.now()
    tileCache[key].use++
  } else {
    const item: TileCacheValue = {
      prevUseTime: Date.now(),
      use: 0,
      type: 0,
      data: generateTile(tile.text)
        .then(data => {
          item.data = data
          item.type = 1
          return data;
        })
    }
    tileCache[key] = item;
  }
  leastUsedDelete()
  return tileCache[key];
};

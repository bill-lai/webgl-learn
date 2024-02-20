/// <reference types="vite/client" />

type Model = { positions: number[]; normals: number[] };

type Material = {
  ambient: number[] | Float32Array;
  diffuse: number[] | Float32Array;
  specluar: number[] | Float32Array;
  shininess: number;
};
type Light = {
  position: number[] | Float32Array;
  ambient: number[] | Float32Array;
  diffuse: number[] | Float32Array;
  specluar: number[] | Float32Array;
};

declare module "assimpjs";

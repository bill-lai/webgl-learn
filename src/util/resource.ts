import axios from "axios";
import chroma from "chroma-js";

export const randRange = (min: number = 1, max: number = min) => {
  if (max === min) {
    min = 0;
  }
  return min + Math.random() * (max - min);
};

export const randRangeInt = (max: number) => Math.floor(randRange(0, max));

export const randColor = () =>
  new Float32Array([randRange(), randRange(), randRange(), 1]);

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  const img = new Image();
  img.src = src;
  return new Promise<HTMLImageElement>((resolve) => {
    img.onload = () => resolve(img);
  });
};

export type Model = { positions: number[]; normals: number[] };
export const loadModel = (url: string): Promise<Model> =>
  axios.get<Model>(url, { responseType: "json" }).then((res) => {
    if (res.status === 200) {
      return res.data;
    } else {
      throw url + " load error status:" + res.status;
    }
  });

export type ModalAttrib = {
  positions: Float32Array;
  includes?: Uint16Array;
};
export const randColorBuffer = (
  modelAttrib: ModalAttrib,
  colorRange: [number, number] = [120, 360]
) => {
  const numElements = modelAttrib.positions.length / 3;
  const vcolorsBuffer = new Uint8Array(4 * numElements);
  // 一般是三角形，让一个面共用一个色
  const pubVertes = 3

  const setFactColor = (idxs: number[]) => {
    const rgba = chroma.hsv(randRange(...colorRange), 1, 1).rgba();
    idxs.forEach(idx => {
      vcolorsBuffer[idx * 4] = rgba[0];
      vcolorsBuffer[idx * 4 + 1] = rgba[1];
      vcolorsBuffer[idx * 4 + 2] = rgba[2];
      vcolorsBuffer[idx * 4 + 3] = rgba[3] * 255;
    })
  }


  if (modelAttrib.includes) {
    for (let i = 0; i < modelAttrib.includes.length; i += pubVertes) {
      setFactColor([...modelAttrib.includes.slice(i, i + pubVertes)])
    }
  } else {
    for (let i = 0; i < numElements; i += pubVertes) {
      const faceIdxs: number[] = []
      const startIdx = i * pubVertes;
      for (let j = 0; j < pubVertes; j++) {
        faceIdxs.push(startIdx + j)
      }
      setFactColor(faceIdxs)
    }
  }
  return vcolorsBuffer;
};


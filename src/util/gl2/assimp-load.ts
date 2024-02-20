import * as assimpjs from "assimpjs";
import { mat4 } from "gl-matrix";

const assimpjsLoad = assimpjs();

export enum SemanticEmum {
  NONE_TEX,
  DIFFUSE_TEX,
  SPECULAR_TEX,
  AMBIENT_TEX,
  EMISSIVE_TEX,
  HEIGHT_TEX,
  NORMALS_TEX,
  SHININESS_TEX,
  OPACITY_TEX,
  DISPLACEMENT_TEX,
  LIGHTMAP_TEX,
  REFLECTION_TEX,
  UNKNOWN_TEX,
}

export type AssimpNode = {
  children: AssimpNode[];
  name: string;
  transformation: mat4;
  meshes?: number[];
};
export type AssimpMesh = {
  faces: number[][];
  name: string;
  normals: number[];
  texturecoords: number[][];
  materialindex: number;
  vertices: number[];
};
export type AssimpMaterialPropertie = {
  index: number;
  key: string;
  semantic: SemanticEmum;
  type: number;
  value: number | number[] | string;
};
export type AssimpMaterial = {
  properties: AssimpMaterialPropertie[];
};

export type AssimpResult = {
  meshes: AssimpMesh[];
  materials: AssimpMaterial[];
  rootnode: AssimpNode;
};

export const assimpLoad = async (files: string[]): Promise<AssimpResult> => {
  const ajs = await assimpjsLoad;
  const arrayBuffers = await Promise.all(
    files.map((file) => fetch(file).then((res) => res.arrayBuffer()))
  );

  let fileList = new ajs.FileList();
  for (let i = 0; i < files.length; i++) {
    fileList.AddFile(files[i], new Uint8Array(arrayBuffers[i]));
  }
  // convert file list to assimp json
  const result = ajs.ConvertFileList(fileList, "assjson");

  // check if the conversion succeeded
  if (!result.IsSuccess() || result.FileCount() == 0) {
    throw result.GetErrorCode();
  }

  // get the result file, and convert to string
  let resultFile = result.GetFile(0);
  let jsonContent = new TextDecoder().decode(resultFile.GetContent());

  // parse the result json
  let resultJson = JSON.parse(jsonContent);
  return resultJson;
};

import { mat4 } from "gl-matrix";
import {
  AssimpMaterial,
  AssimpMesh,
  AssimpNode,
  AssimpResult,
  SemanticEmum,
} from "./assimp-load";
import { createTransform } from "./mat4-pack";

type VertexItemConfig = { start: number; end: number; unitByte: number };

const createVertexs = (aMesh: AssimpMesh) => {
  const verticesConfig = {
    start: 0,
    end: aMesh.vertices.length,
    unitByte: Float32Array.BYTES_PER_ELEMENT,
  };
  const normalsConfig = {
    start: verticesConfig.end,
    end: verticesConfig.end + aMesh.normals.length,
    unitByte: Float32Array.BYTES_PER_ELEMENT,
  };

  const texcoords = aMesh.texturecoords[0];
  const texcoordsConfig: VertexItemConfig = {
    start: normalsConfig.end,
    end: normalsConfig.end + texcoords.length,
    unitByte: Float32Array.BYTES_PER_ELEMENT,
  };

  const vertexs = new Float32Array(texcoordsConfig.end);
  vertexs.set(aMesh.vertices, verticesConfig.start);
  vertexs.set(aMesh.normals, normalsConfig.start);
  vertexs.set(texcoords, texcoordsConfig.start);

  return {
    verticesConfig,
    normalsConfig,
    texcoordsConfig,
    vertexs,
  };
};

type MeshMaterial = {
  [key in string]: number | number[] | string;
};

export const texKeyMap: { [key in SemanticEmum]: string } = {
  [SemanticEmum.NONE_TEX]: "noneTex",
  [SemanticEmum.DIFFUSE_TEX]: "diffuseTex",
  [SemanticEmum.SPECULAR_TEX]: "specluarTex",
  [SemanticEmum.AMBIENT_TEX]: "ambientTex",
  [SemanticEmum.EMISSIVE_TEX]: "emissiveTex",
  [SemanticEmum.HEIGHT_TEX]: "heightTex",
  [SemanticEmum.NORMALS_TEX]: "normalsTex",
  [SemanticEmum.SHININESS_TEX]: "shininessTex",
  [SemanticEmum.OPACITY_TEX]: "opacityTex",
  [SemanticEmum.DISPLACEMENT_TEX]: "displacementTex",
  [SemanticEmum.LIGHTMAP_TEX]: "lightmapTex",
  [SemanticEmum.REFLECTION_TEX]: "replacetionTex",
  [SemanticEmum.UNKNOWN_TEX]: "unkownTex",
};

const parseAMaterial = (aMaterial: AssimpMaterial, basePath: string = "") => {
  const material: MeshMaterial = {};
  for (const propertie of aMaterial.properties) {
    const sps = propertie.key.split(".");
    const isTex = ![SemanticEmum.NONE_TEX, SemanticEmum.UNKNOWN_TEX].includes(
      propertie.semantic
    );
    if (isTex && propertie.type === 4) continue;
    const key = isTex
      ? texKeyMap[propertie.semantic]
      : sps.length > 1
      ? sps[1]
      : sps[0];
    const value = isTex ? basePath + propertie.value : propertie.value;

    if (key !== "name") {
      material[key] = value;
    }
  }
  return material;
};

export class EmptyMesh {
  parent?: Mesh | EmptyMesh;
  children: (Mesh | EmptyMesh)[] = [];
  transform: ReturnType<typeof createTransform>;
  name: string;

  constructor(name: string, initMut?: mat4) {
    this.transform = createTransform(initMut && { initMutMat: initMut });
    this.name = name;
  }

  setParent(parent: EmptyMesh | Mesh) {
    if (this.parent) {
      const ndx = this.parent.children.indexOf(this);
      if (ndx !== -1) {
        this.parent.children.splice(ndx, 1);
      }
    }
    this.parent = parent;
    parent.children.push(this);
  }
}

export class Mesh extends EmptyMesh {
  vertexs: Float32Array;
  faces: Uint16Array;
  numFaceStep: number;
  verticesConfig: VertexItemConfig;
  normalsConfig: VertexItemConfig;
  texcoordsConfig: VertexItemConfig;
  material: {
    [key in string]: number | number[] | string;
  };

  constructor(
    aMesh: AssimpMesh,
    aMaterial: AssimpMaterial,
    basePath: string = "",
    initMut?: mat4
  ) {
    super(aMesh.name, initMut);
    this.faces = new Uint16Array(
      aMesh.faces.reduce((t, c) => t.concat(c), [] as number[])
    );
    this.numFaceStep = aMesh.faces[0].length;

    const { verticesConfig, normalsConfig, texcoordsConfig, vertexs } =
      createVertexs(aMesh);

    this.verticesConfig = verticesConfig;
    this.normalsConfig = normalsConfig;
    this.texcoordsConfig = texcoordsConfig;
    this.vertexs = vertexs;
    this.material = parseAMaterial(aMaterial, basePath);
  }

  getMat() {
    if (this.parent) {
      return this.parent.transform.multiply(this.transform.get()).get();
    } else {
      return this.transform.get();
    }
  }
}

export const assimpNodeParse = (
  aNode: AssimpNode,
  aResult: AssimpResult,
  basePath: string = ""
) => {
  let rootMesh!: EmptyMesh | Mesh;
  if (!aNode.meshes || aNode.meshes.length > 1) {
    rootMesh = new EmptyMesh(aNode.name);
  }

  if (aNode.meshes) {
    const meshs = aNode.meshes.map((ndx) => {
      const aMesh = aResult.meshes[ndx];
      const aMaterial = aResult.materials[aMesh.materialindex];
      return new Mesh(aMesh, aMaterial, basePath, aNode.transformation);
    });
    if (rootMesh) {
      meshs.forEach((mesh) => mesh.setParent(mesh));
    } else {
      rootMesh = meshs[0];
    }
  }

  if (aNode.children) {
    for (const caMesh of aNode.children) {
      const cMesh = assimpNodeParse(caMesh, aResult, basePath);
      cMesh.setParent(rootMesh);
    }
  }
  return rootMesh;
};

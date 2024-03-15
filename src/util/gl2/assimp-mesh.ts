import { mat4 } from "gl-matrix";
import {
  AssimpMaterial,
  AssimpMesh,
  AssimpNode,
  AssimpResult,
  SemanticEmum,
} from "./assimp-load";
import { createTransform } from "./mat4-pack";
import { generateTex, useTex } from "./gl";

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
  positions: Float32Array;
  normals: Float32Array;
  texcoords: Float32Array;
  faces: Uint16Array;
  numFaceStep: number;
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

    this.positions = new Float32Array(aMesh.vertices);
    this.normals = new Float32Array(aMesh.normals);
    this.texcoords = new Float32Array(aMesh.texturecoords[0]);
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

export const traverseMesh = (
  root: Mesh | EmptyMesh,
  oper: (mesh: Mesh | EmptyMesh) => void
) => {
  oper(root);
  root.children.forEach((child) => traverseMesh(child, oper));
};

type GL = WebGL2RenderingContext;
type PG = WebGLProgram;
export type Texs = { [key in string]: WebGLTexture };

const texKeys = Object.entries(texKeyMap).map(([_, v]) => v);
const glTexsCache = new WeakMap<GL, Texs>();
export const meshTexsGenerate = (gl: GL, mesh: Mesh) => {
  const texsMap = Object.entries(mesh.material).filter(([key]) =>
    texKeys.includes(key)
  ) as [string, string][];

  glTexsCache.has(gl) || glTexsCache.set(gl, {});

  const texsCache = glTexsCache.get(gl)!;
  return texsMap.map(([key, texURI]) => {
    const type =
      key === texKeyMap[SemanticEmum.DIFFUSE_TEX] ? gl.SRGB8_ALPHA8 : gl.RGBA;
    // const type = gl.RGBA;
    const texMap = texsCache[texURI]
      ? { tex: texsCache[texURI], loaded: Promise.resolve() }
      : generateTex(gl, texURI, gl.CLAMP_TO_EDGE, type);

    texsCache[texURI] = texMap.tex!;
    return { ...texMap, name: texURI };
  });
};

export const meshVAOGenerate = (gl: GL, program: PG, mesh: Mesh) => {
  const pointers = [
    {
      size: 3,
      map: "positions",
      loc: gl.getAttribLocation(program, "position"),
    },
    {
      size: 2,
      map: "texcoords",
      loc: gl.getAttribLocation(program, "texcoord"),
    },
    { size: 3, map: "normals", loc: gl.getAttribLocation(program, "normal") },
  ] as const;
  const dataSize = pointers.reduce(
    (t, i) =>
      t + (~i.loc ? mesh[i.map].length * Float32Array.BYTES_PER_ELEMENT : 0),
    0
  );

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, dataSize, gl.STATIC_DRAW);

  let vOffset = 0;
  for (const { loc, size, map } of pointers) {
    if (loc !== -1) {
      gl.bufferSubData(gl.ARRAY_BUFFER, vOffset, mesh[map]);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, vOffset);
      vOffset += mesh[map].length * Float32Array.BYTES_PER_ELEMENT;
    }
  }

  const eleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eleBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.faces, gl.STATIC_DRAW);

  return vao;
};

export const getMeshUniforms = (gl: GL, mesh: Mesh, texs: Texs, start = 0) => {
  const materialEntries = Object.entries(mesh.material);
  const texMaterial = Object.fromEntries(
    materialEntries
      .filter(([key]) => texKeys.includes(key))
      .map(([k, v], i) => [
        k,
        useTex(gl, texs[v as string], gl.TEXTURE_2D, start + i),
      ])
  );
  const pubMaterial = Object.fromEntries(
    materialEntries.filter(([key]) => !texKeys.includes(key))
  ) as any;

  return {
    material: { ...texMaterial, ...pubMaterial },
    worldMat: mesh.getMat(),
  };
};

import { AssimpResult } from "./assimp-load";
import { EmptyMesh, Mesh, assimpNodeParse, texKeyMap } from "./assimp-mesh";
import { generateTex } from "./gl";
import { setUniforms } from "./setUniform";

const traverseMesh = (
  root: Mesh | EmptyMesh,
  oper: (mesh: Mesh | EmptyMesh) => void
) => {
  oper(root);
  root.children.forEach((child) => traverseMesh(child, oper));
};

const texKeys = Object.entries(texKeyMap).map(([_, v]) => v);
const glTexsCache: WeakMap<
  WebGL2RenderingContext,
  { [key in string]: WebGLTexture }
> = new WeakMap();
const meshTexsGenerate = (gl: WebGL2RenderingContext, mesh: Mesh) => {
  const texsMap = Object.entries(mesh.material).filter(([key]) =>
    texKeys.includes(key)
  ) as [string, string][];

  glTexsCache.has(gl) || glTexsCache.set(gl, {});

  const texsCache = glTexsCache.get(gl)!;
  return texsMap.map(([key, texURI]) => {
    const texMap = texsCache[texURI]
      ? { tex: texsCache[texURI], loaded: Promise.resolve() }
      : generateTex(gl, texURI);

    texsCache[texURI] = texMap.tex!;
    return { ...texMap, name: texURI };
  });
};

const meshVAOGenerate = ({ gl, program }: GLCtx, mesh: Mesh) => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexs, gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, "position");
  if (positionLoc !== -1) {
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(
      positionLoc,
      3,
      gl.FLOAT,
      false,
      0,
      mesh.verticesConfig.start * Float32Array.BYTES_PER_ELEMENT
    );
  }

  const texcoordLoc = gl.getAttribLocation(program, "texcoord");
  if (texcoordLoc !== -1) {
    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(
      texcoordLoc,
      2,
      gl.FLOAT,
      false,
      0,
      mesh.texcoordsConfig.start * Float32Array.BYTES_PER_ELEMENT
    );
  }

  const normalLoc = gl.getAttribLocation(program, "normal");
  if (normalLoc !== -1) {
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(
      normalLoc,
      3,
      gl.FLOAT,
      false,
      0,
      mesh.normalsConfig.start * Float32Array.BYTES_PER_ELEMENT
    );
  }

  const eleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eleBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.faces, gl.STATIC_DRAW);

  return vao;
};

const drawMesh = (
  { gl, program }: GLCtx,
  mesh: Mesh,
  attrib: MeshDrawAttrib
) => {
  gl.bindVertexArray(attrib.vao);

  const materialEntries = Object.entries(mesh.material);
  const texMaterial = Object.fromEntries(
    materialEntries
      .filter(([key]) => texKeys.includes(key))
      .map(([k, v], i) => {
        const tex = attrib.texs[v as string];
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        return [k, i];
      })
  );
  const pubMaterial = Object.fromEntries(
    materialEntries.filter(([key]) => !texKeys.includes(key))
  ) as any;

  setUniforms(gl, program, { ...texMaterial, ...pubMaterial }, "material.");
  setUniforms(gl, program, { worldMat: mesh.getMat() });
  gl.drawElements(gl.TRIANGLES, mesh.faces.length, gl.UNSIGNED_SHORT, 0);
};

type GLCtx = { gl: WebGL2RenderingContext; program: WebGLProgram };
type MeshDrawAttrib = {
  texs: { [key in string]: WebGLTexture };
  vao: WebGLVertexArrayObject;
};

export class Model {
  ctx?: GLCtx;
  root: EmptyMesh | Mesh;
  meshsDrawAttrib = new Map<Mesh, MeshDrawAttrib>();

  constructor(root: EmptyMesh | Mesh) {
    this.root = root;
  }

  init(ctx: GLCtx) {
    if (this.ctx && this.ctx.gl === ctx.gl && this.ctx.program === ctx.program)
      return Promise.resolve();

    const texLoadeds: Promise<void>[] = [];
    traverseMesh(this.root, (mesh) => {
      if (!(mesh instanceof Mesh)) return;

      let meshTexs: { [key in string]: WebGLTexture } = {};
      if (!this.ctx || this.ctx.gl !== ctx.gl) {
        for (const { tex, loaded, name } of meshTexsGenerate(ctx.gl, mesh)) {
          texLoadeds.push(loaded);
          meshTexs[name] = tex!;
        }
      } else {
        meshTexs = this.meshsDrawAttrib.get(mesh)!.texs;
      }

      const vao = meshVAOGenerate(ctx, mesh)!;
      this.meshsDrawAttrib.set(mesh, { texs: meshTexs, vao });
    });
    this.ctx = ctx;
    return Promise.all(texLoadeds);
  }

  setCtx(ctx: GLCtx) {
    this.init(ctx);
  }

  changeProgram(program: WebGLProgram) {
    this.init({ ...this.ctx!, program });
  }

  draw() {
    if (!this.ctx) throw "没有gl属性";
    this.ctx.gl.useProgram(this.ctx.program);
    traverseMesh(this.root, (mesh) => {
      if (!(mesh instanceof Mesh)) return;
      drawMesh(this.ctx!, mesh, this.meshsDrawAttrib.get(mesh)!);
    });
  }
}

export const assimpParse = (aResult: AssimpResult, basePath: string = "") => {
  const rootMesh = assimpNodeParse(aResult.rootnode, aResult, basePath);
  return new Model(rootMesh);
};

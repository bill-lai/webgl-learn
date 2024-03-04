import { AssimpResult } from "./assimp-load";
import { EmptyMesh, Mesh, assimpNodeParse } from "./assimp-mesh";
import { setUniforms } from "./setUniform";
import {
  traverseMesh,
  meshTexsGenerate,
  meshVAOGenerate,
  getMeshUniforms,
} from "./assimp-mesh";

const drawMesh = (
  { gl, program }: GLCtx,
  mesh: Mesh,
  attrib: MeshDrawAttrib
) => {
  gl.bindVertexArray(attrib.vao);
  setUniforms(gl, program, getMeshUniforms(gl, mesh, attrib.texs));
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

      const vao = meshVAOGenerate(ctx.gl, ctx.program, mesh)!;
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

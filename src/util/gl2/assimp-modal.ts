import { AssimpResult } from "./assimp-load";
import { EmptyMesh, Mesh, assimpNodeParse } from "./assimp-mesh";
import { setUniforms } from "./setUniform";
import {
  traverseMesh,
  meshTexsGenerate,
  meshVAOGenerate,
  getMeshUniforms,
  Texs,
} from "./assimp-mesh";

export class Model {
  gl?: WebGL2RenderingContext;
  program?: WebGLProgram;
  root: EmptyMesh | Mesh;
  meshTexs = new WeakMap<WebGL2RenderingContext, Map<Mesh, Texs>>();
  meshVaos = new WeakMap<WebGLProgram, Map<Mesh, WebGLVertexArrayObject>>();

  constructor(root: EmptyMesh | Mesh) {
    this.root = root;
  }

  getTexs(mesh: Mesh) {
    return this.gl && this.meshTexs.get(this.gl)?.get(mesh);
  }

  getVao(mesh: Mesh) {
    return this.program && this.meshVaos.get(this.program)?.get(mesh);
  }

  setTexs(mesh: Mesh, texs: Texs) {
    if (this.gl) {
      if (!this.meshTexs.has(this.gl)) {
        this.meshTexs.set(this.gl, new Map());
      }
      this.meshTexs.get(this.gl)!.set(mesh, texs);
    }
  }

  setVao(mesh: Mesh, vao: WebGLVertexArrayObject) {
    if (this.program) {
      if (!this.meshVaos.has(this.program)) {
        this.meshVaos.set(this.program, new Map());
      }
      this.meshVaos.get(this.program)!.set(mesh, vao);
    }
  }

  bindProgram(program: WebGLProgram) {
    this.gl && this.init(this.gl, program);
  }

  bindGl(gl: WebGL2RenderingContext) {
    this.program && this.init(gl, this.program);
  }

  init(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const reGl = !this.gl || gl !== this.gl;
    const rePg = !this.program || gl !== this.program;
    if (!reGl && !rePg) return Promise.resolve();

    this.gl = gl;
    this.program = program;

    const texLoadeds: Promise<void>[] = [];
    traverseMesh(this.root, (mesh) => {
      if (!(mesh instanceof Mesh)) return;
      if (reGl) {
        const meshTexs = Object.fromEntries(
          meshTexsGenerate(gl, mesh).map(({ tex, loaded, name }) => {
            texLoadeds.push(loaded);
            return [name, tex!];
          })
        );
        this.setTexs(mesh, meshTexs);
      }
      if (reGl || rePg) {
        this.setVao(mesh, meshVAOGenerate(gl, program, mesh)!);
      }
    });
    return Promise.all(texLoadeds);
  }

  draw() {
    if (!this.gl || !this.program) throw "没有gl属性";
    const { gl, program } = this;

    gl.useProgram(program);
    traverseMesh(this.root, (mesh) => {
      if (!(mesh instanceof Mesh)) return;
      gl.bindVertexArray(this.getVao(mesh)!);
      setUniforms(gl, program, getMeshUniforms(gl, mesh, this.getTexs(mesh)!));
      gl.drawElements(gl.TRIANGLES, mesh.faces.length, gl.UNSIGNED_SHORT, 0);
    });
  }
}

export const generateAssimpModal = (
  aResult: AssimpResult,
  basePath: string = ""
) => {
  const rootMesh = assimpNodeParse(aResult.rootnode, aResult, basePath);
  return new Model(rootMesh);
};

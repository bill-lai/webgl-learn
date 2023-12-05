import { Ref, computed, watch, shallowRef, ref, toRaw } from "vue";
import {
  identity,
  multiply,
  rotateX,
  rotateY,
  rotateZ,
  scale,
  translate,
} from "./mt4";

type TRSDataVal =
  | [number, number, number]
  | [number, number]
  | [number]
  | number;
type TRSData = {
  translate?: TRSDataVal;
  scale?: TRSDataVal;
  rotation?: TRSDataVal;
};
type TRSNData = {
  translate?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
};

const normalTRSArgs = (
  x: number,
  def: number,
  isRotate = false,
  y?: number,
  z?: number
): [number, number, number] => {
  if (y === undefined && z === undefined) {
    if (isRotate) {
      z = x;
      x = def;
      y = def;
    } else {
      y = z = x;
    }
  } else if (y === undefined) {
    y = def;
  } else if (z === undefined) {
    z = def;
  }
  return [x, y!, z!];
};

const normalTRSNewArgs = (value: TRSDataVal, def: number, isRotate = false) => {
  if (Array.isArray(value)) {
    return normalTRSArgs(value[0], def, isRotate, value[1], value[2]);
  } else {
    return normalTRSArgs(value, def, isRotate);
  }
};

// 矩阵对象
class TRS {
  data: TRSNData = {};
  constructor(data: TRSData = {}) {
    if (data.translate != undefined) {
      this.data.translate = normalTRSNewArgs(data.translate, 0);
    }
    if (data.scale != undefined) {
      this.data.scale = normalTRSNewArgs(data.scale, 0);
    }
    if (data.rotation != undefined) {
      this.data.rotation = normalTRSNewArgs(data.rotation, 0, true);
    }
  }

  getMatrix() {
    const partMatrixs: number[][] = [];
    if (this.data.scale) {
      partMatrixs.push(scale(...this.data.scale));
    }
    if (this.data.rotation) {
      partMatrixs.push(
        rotateZ(this.data.rotation[2]),
        rotateY(this.data.rotation[1]),
        rotateX(this.data.rotation[0])
      );
    }
    if (this.data.translate) {
      partMatrixs.push(translate(...this.data.translate));
    }

    if (partMatrixs.length > 0) {
      return multiply(...partMatrixs);
    } else {
      return identity();
    }
  }

  translate(x: number, y?: number, z?: number) {
    this.data.translate = normalTRSArgs(x, 0, false, y, z);
  }

  scale(x: number, y?: number, z?: number) {
    this.data.scale = normalTRSArgs(x, 1, false, y, z);
  }

  rotate(x: number, y?: number, z?: number) {
    this.data.rotation = normalTRSArgs(x, 0, true, y, z);
  }
}

// 获取当前节点的世界矩阵
const getNodeWorldMatrix = (node: SceneNode) => {
  const parent = node.getParent();
  if (parent) {
    return multiply(parent.worldMatrix.value, node.getLocalMatrix());
  } else {
    return node.getLocalMatrix();
  }
};

export type SceneNodeArgs = {
  trs?: TRSData;
  parent?: SceneNode;
};
const defMatrix = identity();
// 场景图节点
export class SceneNode {
  private parent: Ref<SceneNode | null> = shallowRef(null);
  private beforeDirtysTRS = ref<TRS[]>([]);
  private afterDirtysTRS = ref<TRS[]>([]);
  private initTRS: TRS | null = null;
  private localMatrix: number[] = defMatrix;
  private destroyHooks: Array<() => void> = [];

  children: SceneNode[] = [];
  worldMatrix: Ref<number[]>;

  constructor({ trs, parent }: SceneNodeArgs = {}) {
    this.init();
    if (trs) {
      this.initTRS = this.pushTRS(trs);
    }
    parent && this.setParent(parent);
    this.worldMatrix = computed(() => getNodeWorldMatrix(this));
  }

  private init() {
    // 更新父级级联更新
    this.destroyHooks.push(
      watch(this.parent, (newParent, oldParent) => {
        if (oldParent) {
          const idx = oldParent.children.indexOf(this);
          ~idx && oldParent.children.splice(idx, 1);
        }
        if (newParent) {
          newParent.children.push(this);
        }
      })
    );
  }

  getTreeNodes() {
    let allChildren: SceneNode[] = [this];
    for (const item of this.children) {
      allChildren.push(...item.getTreeNodes());
    }

    return allChildren;
  }

  getLocalMatrix() {
    const isChange =
      this.beforeDirtysTRS.value.length > 0 ||
      this.afterDirtysTRS.value.length > 0;

    if (isChange) {
      // 防止收集到trs的依赖
      const beforesTRS = toRaw(this.beforeDirtysTRS.value);
      const afterTRS = toRaw(this.afterDirtysTRS.value);

      let matrix = this.localMatrix;
      if (afterTRS.length > 0) {
        matrix = multiply(
          ...afterTRS.reverse().map((trs) => trs.getMatrix()),
          matrix
        );
      }
      if (beforesTRS.length > 0) {
        matrix = multiply(matrix, ...beforesTRS.map((trs) => trs.getMatrix()));
      }

      beforesTRS.length = 0;
      afterTRS.length = 0;
      this.localMatrix = matrix;
    }
    return this.localMatrix;
  }

  pushTRS(trsData?: TRSData) {
    const currentTRS = new TRS(trsData);
    this.afterDirtysTRS.value.push(currentTRS);
    return currentTRS;
  }

  unshiftTRS(trsData?: TRSData) {
    const currentTRS = new TRS(trsData);
    this.beforeDirtysTRS.value.push(currentTRS);
    return currentTRS;
  }

  overlayInitTRS(trsData: TRSData) {
    this.afterDirtysTRS.value = [];
    this.beforeDirtysTRS.value = [];
    this.initTRS = this.pushTRS(trsData);
  }

  private restoreTRS() {
    this.afterDirtysTRS.value = [];
    this.beforeDirtysTRS.value = [];
    if (this.initTRS) {
      this.afterDirtysTRS.value.push(this.initTRS);
    }
    this.localMatrix = defMatrix;
  }

  reSetTRS(trsData?: TRSData) {
    this.restoreTRS();
    return this.pushTRS(trsData);
  }

  reTranslate(x: number, y?: number, z?: number) {
    this.reSetTRS().translate(x, y, z);
    return this;
  }

  translate(x: number, y?: number, z?: number) {
    this.pushTRS().translate(x, y, z);
    return this;
  }

  beTranslate(x: number, y?: number, z?: number) {
    this.unshiftTRS().translate(x, y, z);
    return this;
  }

  reScale(x: number, y?: number, z?: number) {
    this.reSetTRS().scale(x, y, z);
    return this;
  }

  scale(x: number, y?: number, z?: number) {
    this.pushTRS().scale(x, y, z);
    return this;
  }

  beScale(x: number, y?: number, z?: number) {
    this.unshiftTRS().scale(x, y, z);
    return this;
  }

  reRotate(x: number, y?: number, z?: number) {
    this.reSetTRS().rotate(x, y, z);
    return this;
  }

  rotate(x: number, y?: number, z?: number) {
    this.pushTRS().rotate(x, y, z);
    return this;
  }

  beRotate(x: number, y?: number, z?: number) {
    this.unshiftTRS().rotate(x, y, z);
    return this;
  }
  getParent() {
    return this.parent.value;
  }

  setParent(node: SceneNode | null) {
    this.parent.value = node;
  }

  destroy() {
    this.destroyHooks.forEach((hook) => hook());
  }
}

export type SceneNodeConfig<T extends string> = {
  name: T;
  trs?: TRSData;
  children?: SceneNodeConfig<T>[];
};
type ConfigSceneNode<T extends string> = { [key in T]: SceneNode };
const createSceneNodeByConfig = <T extends string>(
  config: SceneNodeConfig<T>,
  parent?: SceneNode,
  map: ConfigSceneNode<T> = {} as any
): ConfigSceneNode<T> => {
  const current = new SceneNode({ parent, trs: config.trs });
  if (config.children) {
    for (const child of config.children) {
      createSceneNodeByConfig(child, current, map);
    }
  }
  map[config.name] = current;
  return map;
};

export const getSceneNodeByConfig = <T extends string>(
  config: SceneNodeConfig<T>
) => createSceneNodeByConfig(config);

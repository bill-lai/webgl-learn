import { Ref, reactive } from "vue";

const modules = import.meta.glob(["@/example/*/export.ts"]) as {
  [key in string]: () => Promise<ExampleExport>;
};
console.log(modules);
export type ExampleMeta = {
  name: string;
  cover: string;
  type?: string;
  material: { type: "code" | "img"; content: string; name: string }[];
};

export type InitProps = {
  setAppendComponent: (component: any, props?: any) => void;
  fps: Ref<number | null>;
};
export type ExampleInit = (
  canvas: HTMLCanvasElement,
  props: InitProps
) => Promise<Function | void> | Function | void;
export type ExampleExport = {
  init: ExampleInit;
  meta: ExampleMeta;
};

type AModule = { [key in string]: ExampleExport };
export const aModule: AModule = reactive({});
Object.entries(modules).forEach(([k, v]) => {
  v().then((meta) => {
    aModule[k] = meta;
  });
});

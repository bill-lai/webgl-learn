let modules = import.meta.glob("./**/index.ts");

const excludes = ["./draw-image/index.ts", "./renderBigCanvas/index.ts", "./views/index.ts"]

for (let key of excludes) {
  delete modules[key]
}

console.log(modules)

export const initsPromise = Promise.all(
  Object.values(modules).map((load) => load())
).then((modules) =>
  modules
  .map((item: any) => {
    if (!item.init && !item.initCanvas) {
    }
    return item.init || item.initCanvas;
  })
  .filter(item => !! item)
);

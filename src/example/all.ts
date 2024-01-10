const modules = import.meta.glob('./**/index.ts')

const components = Object.values(modules).map(load => load())

console.log(components, modules)
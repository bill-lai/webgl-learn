import { loadResource } from "./load";
import { generateModalFactory } from "./math-3d";

const lineProcessing = (
  text: string,
  handler: (text: string) => void,
  ignores = ["#"]
) => {
  const lines = text.split("\n");
  const ignoreRE = ignores.length > 0 
    ? new RegExp('\\' + ignores.join('|\\'), 'ig') 
    : null
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) {
      continue;
    } else if (ignoreRE) {
      const index = ignoreRE.exec(line)?.index
      let context
      if (index !== 0 && (context = line.substring(0, index || line.length))) {
        handler(context)
      }
      ignoreRE.lastIndex = 0
    } else {
      handler(line)
    }
  }
}

type Processor = (args: string[]) => void
const objProcessorFactory = () => {
  const vertexs: number[][] = []
  const texcoords: number[][] = []
  const normals: number[][] = []
  const materialLib: string[][] = []
  const materials: string[] = []
  const groups: string[] = []
  const names: string[] = []
  const generateModals = [] as Array<ReturnType<typeof generateModalFactory>>
  let used = true

  const pushGenerateModal = () => {
    if (used) {
      used = false
      generateModals.push(generateModalFactory())
    }
  }
  let fcount = 0
  const keyHandler: {[key in string]: Processor} = {
    v(args) {
      vertexs.push(args.map(parseFloat))
    },
    vt(args) {
      texcoords.push(args.map(parseFloat))
    },
    vn(args) {
      normals.push(args.map(parseFloat))
    },
    mtllib(args) {
      materialLib.push(args)
    },
    usemtl(args) {
      materials.push(args.join(' '))
      pushGenerateModal()
    },
    o(args) {
      names.push(args.join(' '))
      pushGenerateModal()
    },
    g(args) {
      groups.push(args.join(' '))
      pushGenerateModal()
    },
    f(args) {
      used = true

      ++fcount;

      const infos = args.map(arg => arg.split('/').map(s => s ? (Number(s) - 1) : -1))
      const numTriangles = infos.length - 2;
      const generateModal = generateModals[generateModals.length - 1]

      for (let i = 0; i < numTriangles; i++) {
        const indexs = [0, i + 1, i + 2];
        indexs.forEach(index => {
          const [v, vt, vn] = infos[index]
          generateModal.setItem(
            vertexs[v], 
            ~vn ? normals[vn] : undefined, 
            ~vt ? texcoords[vt] : undefined
          )
        })
      }
    }
  }
  return {
    next(key: string, unparseArgs: string) {
      if (key in keyHandler) {
        keyHandler[key](unparseArgs.split(/\s+/))
      } else {
        console.warn(`objProcessor 无法处理${key}关键字`)
      }
    },
    get() {
      console.log(fcount)
      return {
        materialLib,
        // vertexs,
        // texcoords,
        // normals,
        models: generateModals.map((item, i) => ({
          name: names[i],
          group: groups[i],
          material: materials[i],
          ...item.get()
        }))
      }
    }
  }
}

export const parseObj = (text: string) => {
  const objProcessor = objProcessorFactory()
  const RE = /(\w*)(?: )*(.*)/;
  lineProcessing(text, line => {
    let m
    if (m = line.match(RE)) {
      const [, keyword, unparseArgs] = m;
      objProcessor.next(keyword, unparseArgs);
    }
  })
  return objProcessor.get()
};

export const loadObj = async (url: string) => {
  const [text] = await loadResource(url)
  const obj = parseObj(text)

  return obj;
}
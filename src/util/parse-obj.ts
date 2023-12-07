import { loadResource } from "./load";
import { generateModalFactory, generateTangents } from "./math-3d";

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

type LineProcessor<T> = {
  next: (key: string, unparseArgs: string) => void,
  get: () => T
}

type Processor = (args: string[]) => void
const objProcessorFactory = (autoGenerateTangents = false) => {
  const vertexs: number[][] = []
  const texcoords: number[][] = []
  const normals: number[][] = []
  const colors: number[][] = []
  const materialLib: string[][] = []
  const materialNames: string[] = []
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
      if (args.length <= 3) {
        vertexs.push(args.map(parseFloat))
      } else {
        vertexs.push(args.slice(0, 3).map(parseFloat))
        colors.push(args.slice(3).map(parseFloat))
      }
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
      materialNames.push(args.join(' '))
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
            normals[vn] || [],
            texcoords[vt] || [],
            colors[v] || []
          );
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
      
      return {
        materialLib,
        models: generateModals.map((item, i) => {
          let arrays = item.get();
          let tangentsBuffer: Float32Array | null = null

          if (autoGenerateTangents && item.tempItemsArray[2].length > 0) {
            const tangents = generateTangents({ 
              positions: arrays.itemsArray[0], 
              texcoords: arrays.itemsArray[2], 
              includes: arrays.includes  
            })
            arrays = item.appendGenerate(tangents).get()
            tangentsBuffer = new Float32Array(arrays.itemsArray[4])
          }

          return {
            name: names[i],
            group: groups[i],
            materialName: materialNames[i],
            positions: new Float32Array(arrays.itemsArray[0]),
            normals: new Float32Array(arrays.itemsArray[1]),
            texcoords: new Float32Array(arrays.itemsArray[2]),
            colors: new Float32Array(arrays.itemsArray[3]),
            includes: new Uint16Array(arrays.includes),
            tangents: tangentsBuffer
          }
        })
      }
    }
  }
}

export type Material = {
  shininess: number
  ambient: number[]
  diffuse: number[]
  specular: number[]
  emissive: number[]
  opacity: number
  opticalDensity: number
  illum: number,
  diffuseMap?: string,
  normalMap?: string,
  specularMap?: string
}
export type MaterialMapKey = 'diffuseMap' | 'normalMap' | 'specularMap';
export const materialFactory = (): Material => ({
  shininess: 1,
  ambient: [1, 1, 1],
  diffuse: [1, 1, 1],
  specular: [1, 1, 1],
  emissive: [1, 1, 1],
  opacity: 1,
  opticalDensity: 1,
  illum: 1,
})

export const mtlProcessorFactory = () => {
  const materials: {[key in string]: Material} = {}
  let current: Material

  const keyHandler: {[key in string]: Processor} = {
    newmtl(args) {
      current = materials[args.join(' ')] = materialFactory()
    },
    Ns(args) {
      current.shininess = parseFloat(args[0])
    },
    Ka(args) {
      current.ambient = args.map(parseFloat)
    },
    Kd(args) {
      current.diffuse = args.map(parseFloat)
    },
    Ks(args) {
      current.specular = args.map(parseFloat)
    },
    Ke(args) {
      current.emissive = args.map(parseFloat)
    },
    d(args) {
      current.opacity = parseFloat(args[0])
    },
    Ni(args) {
      current.opticalDensity = parseFloat(args[0])
    },
    illum(args) {
      current.illum = parseFloat(args[0])
    },
    map_Kd(args) {
      current.diffuseMap = args.join(' ')
    },
    map_Ns(args) {
      current.specularMap = args.join(' ')
    },
    map_Bump(args) {
      current.normalMap = args.join(' ')
    }
  }

  return {
    next(key: string, unparseArgs: string) {
      if (key in keyHandler) {
        keyHandler[key](unparseArgs.split(/\s+/))
      } else {
        console.warn(`mtlProcessor 无法处理${key}关键字`)
      }
    },
    get() {
      return materials;
    }
  }
}

export const parse = <T>(text: string, RE: RegExp, processor: LineProcessor<T>) : T => {
  lineProcessing(text, line => {
    let m
    if (m = line.match(RE)) {
      const [, keyword, unparseArgs] = m;
      processor.next(keyword, unparseArgs);
    }
  })
  return processor.get()
};

export const loadObj = async (url: string) => {
  const resource = loadResource(url, ['obj', 'mtl'])
  const [objText, mtlText] = await resource;
  const keyRE = /(\w*)(?: )*(.*)/
  const obj = parse(objText, keyRE, objProcessorFactory(true))
  const mtl = parse(mtlText, keyRE, mtlProcessorFactory())

  
  return obj.models.map(model => {
    const material = mtl[model.materialName]
    const mapsURL: Pick<Material, MaterialMapKey> = {}

    if (material.diffuseMap) {
      mapsURL.diffuseMap = resource.parse([material.diffuseMap])[0]
    }
    if (material.normalMap) {
      mapsURL.normalMap = resource.parse([material.normalMap])[0]
    }
    if (material.specularMap) {
      mapsURL.specularMap = resource.parse([material.specularMap])[0]
    }
    return {
      ...model,
      material: {
        ...material,
        ...mapsURL
      },
    }
  })
}


import {
  Scene,
  WebGLRenderer,
  Mesh,
  TextureLoader,
  PerspectiveCamera,
  ShaderMaterial,
  Vector3,
  SphereGeometry,
  DirectionalLight,
} from "three";
import fragShader from './shader-fragment.frag?raw'
import vertexShader from './shader-vertex.vert?raw'
import dayURI from './day.jpeg'
import nightURI from './night.jpeg'
import { startAnimation } from "../../util";


export const init = (canvas: HTMLCanvasElement) => {
  const scene = new Scene()

  const sunDirection = new Vector3(0, 1, 0);
  const texloader = new TextureLoader();
  const shaderMaterial = new ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragShader,
    uniforms: {
      sunDirection: { value: sunDirection },
      texDay: { value: texloader.load(dayURI) },
      texNight: { value: texloader.load(nightURI) }
    }
  })
  const sphereMesh = new Mesh(new SphereGeometry(0.75, 46, 23), shaderMaterial)
  scene.add(sphereMesh)

  const camera = new PerspectiveCamera(45, canvas.width / canvas.height, 1, 2000);
  camera.position.set(0, 0, 4)
  scene.add(camera)

  const light = new DirectionalLight(0xaaff33, 1)
  light.position.copy(sunDirection)
  scene.add(light)

  const renderer = new WebGLRenderer({ canvas })

  startAnimation((time) => {
    time *= 0.001;
    renderer.render(scene, camera);

    sunDirection.x = Math.sin(time)
    sunDirection.y = Math.cos(time)
    light.position.copy(sunDirection)

    sphereMesh.rotation.x = time * .3
    sphereMesh.rotation.y = time * .7
  })
}
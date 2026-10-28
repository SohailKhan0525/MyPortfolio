// Offline geometry render. No browser or WebGL required.
// node scripts/render-robot-poster.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Scene, OrthographicCamera, AmbientLight, DirectionalLight } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import sharp from "sharp";

// SVGRenderer only needs a tiny XML writer here. Avoid constructing a live DOM
// for the source model's 116,000 triangles during this one-off asset export.
class SvgNode {
  constructor(tag) { this.tag = tag; this.attributes = {}; this.childNodes = []; this.style = {}; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  appendChild(node) { this.childNodes.push(node); }
  removeChild(node) { this.childNodes.splice(this.childNodes.indexOf(node), 1); }
  get outerHTML() {
    const attributes = Object.entries(this.attributes).map(([key, value]) => `${key}="${value.replaceAll('"', '&quot;')}"`).join(" ");
    return `<${this.tag} ${attributes}>${this.childNodes.map(node => node.outerHTML).join("")}</${this.tag}>`;
  }
}
globalThis.document = { createElementNS: (_, tag) => new SvgNode(tag) };
const root = fileURLToPath(new URL("../", import.meta.url));
const bytes = await readFile(path.join(root, "public/models/minty_robot_v2.glb"));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
gltf.scene.traverse(node => {
  if (!node.isMesh) return;
  if (!node.geometry.getAttribute("normal")) node.geometry.computeVertexNormals();
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  for (const material of materials) material.emissive?.multiplyScalar(0.28);
});
gltf.scene.rotation.x = -Math.PI / 2;
gltf.scene.scale.setScalar(2.4 / 149.8);

const scene = new Scene();
scene.add(gltf.scene);
// SVGRenderer reads ambient color directly, rather than its intensity.
const ambient = new AmbientLight();
ambient.color.setRGB(0.24, 0.27, 0.28);
scene.add(ambient);
const key = new DirectionalLight(0xffffff, 0.58);
key.position.set(3, 5, 6);
scene.add(key);
const fill = new DirectionalLight(0xc8f7ed, 0.15);
fill.position.set(-4, 2, 1);
scene.add(fill);

const camera = new OrthographicCamera(-2.95, 2.95, 1.475, -1.475, 0.1, 40);
camera.position.set(0, 3.1, 11);
camera.lookAt(0, 1.15, 0);
const renderer = new SVGRenderer();
renderer.setSize(1280, 640);
renderer.setPrecision(3);
renderer.render(scene, camera);
renderer.domElement.style.backgroundColor = "transparent";
renderer.domElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
const svg = Buffer.from(renderer.domElement.outerHTML);
const target = path.join(root, "public/models/minty-robot-poster.webp");
await sharp(svg).resize(640, 320).webp({ lossless: true }).toFile(target);
console.log(`Rendered ${renderer.info.render.faces} faces to ${target}`);

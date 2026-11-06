// Offline authoring only: split the original Minty rig into crisp transparent
// layers and a small turn atlas. The website uses GSAP + images, never WebGL.
// node scripts/render-minty-layers.mjs
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir, open } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import path from "node:path";
import { OrthographicCamera, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import sharp from "sharp";

class BlobReader {
  result = null;
  onloadend = null;
  onerror = null;
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }, error => this.onerror?.(error)); }
  readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`; this.onloadend?.(); }, error => this.onerror?.(error)); }
}
globalThis.FileReader = BlobReader;
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "public/models/minty-gsap");
const temporary = await mkdtemp(path.join(root, ".minty-layers-"));
const camera = new OrthographicCamera(-3.1, 3.1, 1.55, -1.55, 0.1, 40);
camera.position.set(0, 3.1, 11);
camera.lookAt(0, 1.15, 0);
camera.updateMatrixWorld();
let rig;
try {
  await mkdir(output, { recursive: true });
  for (const filename of await readdir(path.join(root, "app/robot"))) {
    if (!filename.endsWith(".ts")) continue;
    const source = await readFile(path.join(root, "app/robot", filename), "utf8");
    const code = stripTypeScriptTypes(source, { mode: "strip" }).replace(/(from\s+["'])(\.\/[^"']+)(["'])/g, (_, before, specifier, after) => `${before}${specifier.replace(/\.ts$/, "")}.mjs${after}`);
    await writeFile(path.join(temporary, filename.replace(/\.ts$/, ".mjs")), code);
  }
  const { createRobotRig } = await import(pathToFileURL(path.join(temporary, "rig.mjs")));
  const { createRobotAnimator } = await import(pathToFileURL(path.join(temporary, "behavior.mjs")));
  const bytes = await readFile(path.join(root, "public/models/minty_robot_v2.glb"));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  rig = createRobotRig(gltf.scene);
  const rest = createRobotAnimator(() => 0.4).pose;
  rig.applyPose(rest);
  const pivots = {};
  for (const key of ["body", "head", "leftArm", "rightArm"]) {
    const point = rig[key].getWorldPosition(new Vector3()).project(camera);
    pivots[key] = [Number((50 + point.x * 100).toFixed(2)), Number((50 - point.y * 50).toFixed(2))];
  }
  const frames = [];
  async function exportLayer(id, layer, pose = rest, turn = false) {
    rig.applyPose(pose);
    for (const child of rig.root.children) child.visible = child === rig.body ? layer !== "base" : layer === "base" || layer === "all";
    for (const child of rig.body.children) {
      const type = child === rig.head ? "head" : child === rig.leftArm ? "left-arm" : child === rig.rightArm ? "right-arm" : "body";
      child.visible = layer === "all" || layer === type;
    }
    const glb = path.join(temporary, `${id}.glb`);
    const png = path.join(temporary, `${id}.png`);
    const binary = await new GLTFExporter().parseAsync(rig.root, { binary: true, onlyVisible: true });
    await writeFile(glb, Buffer.from(binary));
    frames.push({ id, glb, png, width: turn ? 640 : 768, height: turn ? 320 : 384, samples: turn ? 20 : 56 });
  }
  for (const layer of ["base", "body", "left-arm", "right-arm"]) await exportLayer(layer, layer);
  for (const expression of ["smile", "neutral", "cry", "angry", "sleepy", "dizzy", "confused"]) {
    await exportLayer(`head-${expression}`, "head", { ...rest, expression, expressionFrom: expression, expressionMix: 1, expressionIntensity: 0.8, faceTime: 1.35 });
  }
  await exportLayer("head-blink-half", "head", { ...rest, eyeOpen: 0.35 });
  await exportLayer("head-blink-closed", "head", { ...rest, eyeOpen: 0 });
  await exportLayer("head-look-left", "head", { ...rest, gazeX: -0.8, expression: "neutral", expressionFrom: "neutral" });
  await exportLayer("head-look-right", "head", { ...rest, gazeX: 0.8, expression: "neutral", expressionFrom: "neutral" });
  // 24 true 3D views: opacity remains stable, the raster atlas never interpolates
  // between tiles, and the head/arms resume at the exact neutral endpoint.
  for (let index = 0; index < 24; index++) await exportLayer(`turn-${index}`, "all", { ...rest, bodyYaw: index / 24 * Math.PI * 2 }, true);
  const manifest = path.join(temporary, "frames.json");
  await writeFile(manifest, JSON.stringify({ frames }));
  const log = await open(path.join(temporary, "blender.log"), "w");
  console.log(`Rendering ${frames.length} Minty layers/views. Log: ${temporary}/blender.log`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.env.BLENDER_BIN || "blender", ["--background", "--factory-startup", "--threads", "4", "--python", path.join(root, "scripts/render-robot-blender.py"), "--", manifest], { stdio: ["ignore", log.fd, log.fd] });
    child.on("error", reject); child.on("close", resolve);
  });
  await log.close();
  if (exitCode !== 0) throw new Error(`Blender exited ${exitCode}: ${(await readFile(path.join(temporary, "blender.log"), "utf8")).slice(-4000)}`);
  const turns = [];
  const layerFiles = [];
  for (const frame of frames) {
    const cropped = sharp(frame.png).extract({ left: frame.width / 4, top: 0, width: frame.height, height: frame.height });
    if (frame.id.startsWith("turn-")) turns.push(await cropped.png().toBuffer());
    else {
      await cropped.webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(path.join(output, `${frame.id}.webp`));
      layerFiles.push(`${frame.id}.webp`);
    }
  }
  await sharp({ create: { width: 1920, height: 1280, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(turns.map((input, index) => ({ input, left: index % 6 * 320, top: Math.floor(index / 6) * 320 })))
    .webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(path.join(output, "turn-atlas.webp"));
  await writeFile(path.join(output, "manifest.json"), JSON.stringify({ version: 1, layerSize: 384, pivots, turn: { columns: 6, rows: 4, frames: 24, size: 320 }, files: [...layerFiles, "turn-atlas.webp"] }, null, 2) + "\n");
  console.log(`Minty GSAP layers saved: ${output}; pivots ${JSON.stringify(pivots)}`);
} finally {
  rig?.dispose();
  await rm(temporary, { recursive: true, force: true });
}

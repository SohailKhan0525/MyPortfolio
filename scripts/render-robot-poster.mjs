// Render the current runtime rig, not the GLB's original baked face/raised arm.
// Node 22.13+; no browser or WebGL required.
// node scripts/render-robot-poster.mjs [--qa-dir /absolute/scratch/directory]
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { Scene, OrthographicCamera, AmbientLight, DirectionalLight } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js";
import sharp from "sharp";

// SVGRenderer only needs this small XML writer. A live DOM is unnecessary for
// the source model's 116,000 triangles during an offline asset export.
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
const temporary = await mkdtemp(path.join(root, ".robot-poster-"));
let rig;
try {
  // Strip only types, retaining the same runtime implementation as the website.
  // The temporary files live under the app so regular package resolution works.
  for (const filename of await readdir(path.join(root, "app/robot"))) {
    if (!filename.endsWith(".ts")) continue;
    const source = await readFile(path.join(root, "app/robot", filename), "utf8");
    const code = stripTypeScriptTypes(source, { mode: "strip" })
      .replace(/(from\s+["'])(\.\/[^"']+)(["'])/g, (_, before, specifier, after) =>
        `${before}${specifier.replace(/\.ts$/, "")}.mjs${after}`);
    await writeFile(path.join(temporary, filename.replace(/\.ts$/, ".mjs")), code);
  }
  const { createRobotRig } = await import(pathToFileURL(path.join(temporary, "rig.mjs")));
  const { createRobotAnimator, stepRobotAnimator } = await import(pathToFileURL(path.join(temporary, "behavior.mjs")));
  const bytes = await readFile(path.join(root, "public/models/minty_robot_v2.glb"));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  rig = createRobotRig(gltf.scene);
  rig.applyPose(createRobotAnimator(() => 0.4).pose);

  const scene = new Scene();
  scene.add(rig.root);
  // SVGRenderer reads ambient color directly rather than light intensity. These
  // lights approximate the live model's shading; the pose/face are shared code.
  const ambient = new AmbientLight();
  ambient.color.setRGB(0.24, 0.27, 0.28);
  scene.add(ambient);
  const key = new DirectionalLight(0xffffff, 0.58);
  key.position.set(3, 5, 6);
  scene.add(key);
  const fill = new DirectionalLight(0xc8f7ed, 0.15);
  fill.position.set(-4, 2, 1);
  scene.add(fill);
  const camera = new OrthographicCamera(-3.1, 3.1, 1.55, -1.55, 0.1, 40);
  camera.position.set(0, 3.1, 11);
  camera.lookAt(0, 1.15, 0);

  async function render(width, height) {
    const renderer = new SVGRenderer();
    renderer.setSize(width * 2, height * 2);
    renderer.setPrecision(3);
    renderer.render(scene, camera);
    renderer.domElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return sharp(Buffer.from(renderer.domElement.outerHTML)).resize(width, height).png().toBuffer();
  }
  const target = path.join(root, "public/models/minty-robot-still.webp");
  await sharp(await render(640, 320)).webp({ lossless: true }).toFile(target);
  console.log(`Rendered current Minty rig to ${target}`);

  const qaFlag = process.argv.indexOf("--qa-dir");
  if (qaFlag >= 0) {
    const qaDirectory = path.resolve(process.argv[qaFlag + 1] ?? "");
    await mkdir(qaDirectory, { recursive: true });
    const qaRenders = new Map();
    async function labeledFrame(label) {
      const labelSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="28"><text x="240" y="20" text-anchor="middle" fill="#dddddd" font-family="sans-serif" font-size="15">${label}</text></svg>`);
      const frame = await render(480, 240);
      qaRenders.set(label, frame);
      return sharp(frame).flatten({ background: "#080808" })
        .extend({ top: 0, bottom: 28, left: 0, right: 0, background: "#080808" })
        .composite([{ input: labelSvg, top: 240, left: 0 }]).png().toBuffer();
    }
    async function sheet(frames, columns, filename) {
      await sharp({ create: { width: columns * 480, height: Math.ceil(frames.length / columns) * 268, channels: 4, background: "#080808" } })
        .composite(frames.map((input, i) => ({ input, left: (i % columns) * 480, top: Math.floor(i / columns) * 268 })))
        .png().toFile(path.join(qaDirectory, filename));
    }
    const startup = [];
    const animator = createRobotAnimator(() => 0.4);
    for (const time of [1, 5.6, 7, 9, 10.8, 13]) {
      while (animator.time < time - 1e-8) stepRobotAnimator(animator, Math.min(1 / 60, time - animator.time));
      rig.applyPose(animator.pose);
      startup.push(await labeledFrame(`${time.toFixed(1)}s · ${animator.state}`));
    }
    await sheet(startup, 3, "minty-refined-poses-qa.png");
    const expressions = [];
    for (const expression of ["smile", "neutral", "cry", "angry", "sleepy", "dizzy", "confused"]) {
      const expressionAnimator = createRobotAnimator(() => 0.4);
      expressionAnimator.startupPhase = 8;
      expressionAnimator.state = expression === "neutral" ? "idle" : expression === "confused" ? "stumble" : expression;
      expressionAnimator.duration = 4;
      Object.assign(expressionAnimator.pose, { expression, expressionFrom: expression, expressionMix: 1 });
      // Capture the actual behavior's eyelids/head posture too: a tired expression
      // uses the sleepy state's heavy-lid envelope rather than open neutral eyes.
      for (let frame = 0; frame < 120; frame++) stepRobotAnimator(expressionAnimator, 1 / 60);
      rig.applyPose(expressionAnimator.pose);
      expressions.push(await labeledFrame(expression));
    }
    await sheet(expressions, 4, "minty-refined-expressions-qa.png");
    // Real CSS-pixel companion samples, not enlarged faces. Reproject the same
    // transparent render by cropping its empty margins; camera aim is unchanged.
    for (const [width, height, background, suffix] of [
      [200, 176, "#080808", "mobile-dark"], [200, 176, "#f7f7f4", "mobile-light"],
      [240, 208, "#080808", "desktop-dark"], [160, 140, "#080808", "landscape-dark"],
    ]) {
      const zoom = Math.min(height / 3.1, width / 4.1);
      const scaledHeight = Math.round(zoom * 3.1);
      const scaledWidth = scaledHeight * 2;
      const compact = [];
      for (const expression of ["smile", "neutral", "cry", "angry", "sleepy", "dizzy", "confused"]) {
        const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="24"><text x="${width / 2}" y="17" text-anchor="middle" fill="${background === "#080808" ? "#ddd" : "#333"}" font-family="sans-serif" font-size="12">${expression}</text></svg>`);
        const resized = await sharp(qaRenders.get(expression)).resize(scaledWidth, scaledHeight).png().toBuffer();
        const cropped = await sharp(resized).extract({ left: Math.floor((scaledWidth - width) / 2), top: 0, width, height: scaledHeight })
          .extend({ top: Math.floor((height - scaledHeight) / 2), bottom: Math.ceil((height - scaledHeight) / 2), left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .flatten({ background }).extend({ bottom: 24, top: 0, left: 0, right: 0, background })
          .composite([{ input: label, top: height, left: 0 }]).png().toBuffer();
        compact.push(cropped);
      }
      await sharp({ create: { width: width * 4, height: (height + 24) * 2, channels: 4, background } })
        .composite(compact.map((input, i) => ({ input, left: i % 4 * width, top: Math.floor(i / 4) * (height + 24) })))
        .png().toFile(path.join(qaDirectory, `minty-expressions-${suffix}.png`));
    }
    console.log(`Rendered runtime-pose QA sheets to ${qaDirectory}`);
  }
} finally {
  rig?.dispose();
  await rm(temporary, { recursive: true, force: true });
}

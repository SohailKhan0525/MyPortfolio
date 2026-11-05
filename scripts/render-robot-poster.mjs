// Render the actual runtime rig/face through Blender's PBR renderer.
// Node 22.13+, Blender 4.x and the project's existing Three/Sharp dependencies.
// node scripts/render-robot-poster.mjs [--qa-dir /absolute/scratch/path]
// Optional: --output /path/poster.webp --samples 64 --only smile,cry,angry
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir, open } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import path from "node:path";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import sharp from "sharp";

// GLTFExporter uses this browser reader for its final binary Blob. No canvas,
// DOM, browser, network service or live WebGL context is involved in this export.
class BlobReader {
  result = null;
  onloadend = null;
  onerror = null;
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }, error => this.onerror?.(error));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(value => {
      this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(value).toString("base64")}`;
      this.onloadend?.();
    }, error => this.onerror?.(error));
  }
}
globalThis.FileReader = BlobReader;
const argument = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const root = fileURLToPath(new URL("../", import.meta.url));
const qaDirectory = argument("--qa-dir") ? path.resolve(argument("--qa-dir")) : null;
const output = path.resolve(argument("--output") ?? path.join(root, "public/models/minty-robot-still.webp"));
const samples = Math.max(8, Math.min(256, Number(argument("--samples") ?? 96)));
const only = argument("--only")?.split(",");
const temporary = await mkdtemp(path.join(root, ".robot-poster-"));
let rig;
try {
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
  const frames = [];
  async function exportPose(id, label, pose, width = 640, height = 320, quality = Math.min(samples, 48)) {
    rig.applyPose(pose);
    rig.root.updateMatrixWorld(true);
    const glb = path.join(temporary, `${id}.glb`);
    const png = path.join(temporary, `${id}.png`);
    const binary = await new GLTFExporter().parseAsync(rig.root, { binary: true, onlyVisible: true });
    await writeFile(glb, Buffer.from(binary));
    frames.push({ id, label, glb, png, width, height, samples: quality });
  }
  await exportPose("poster", "Minty", createRobotAnimator(() => 0.4).pose, 1280, 640, samples);
  if (qaDirectory) {
    await mkdir(qaDirectory, { recursive: true });
    for (const expression of ["smile", "neutral", "cry", "angry", "sleepy", "dizzy", "confused"]) {
      if (only && !only.includes(expression)) continue;
      const animator = createRobotAnimator(() => 0.4);
      animator.startupPhase = 8;
      animator.state = expression === "neutral" ? "idle" : expression === "confused" ? "stumble" : expression;
      animator.duration = 4;
      Object.assign(animator.pose, { expression, expressionFrom: expression, expressionMix: 1 });
      for (let frame = 0; frame < 120; frame++) stepRobotAnimator(animator, 1 / 60);
      await exportPose(`expression-${expression}`, expression, animator.pose);
    }
    if (!only) {
      const animator = createRobotAnimator(() => 0.4);
      for (const [index, time] of [1, 5.6, 7, 9, 10.8, 13].entries()) {
        while (animator.time < time - 1e-8) stepRobotAnimator(animator, Math.min(1 / 60, time - animator.time));
        await exportPose(`startup-${index}`, `${time.toFixed(1)}s · ${animator.state}`, animator.pose, 640, 320, Math.min(samples, 32));
      }
    }
  }
  const manifest = path.join(temporary, "frames.json");
  await writeFile(manifest, JSON.stringify({ frames }));
  const logPath = path.join(temporary, "blender.log");
  const log = await open(logPath, "w");
  console.log(`Rendering ${frames.length} runtime poses with Blender Cycles; poster 1280×640, ${samples} samples.`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.env.BLENDER_BIN || "blender", ["--background", "--factory-startup", "--threads", "4", "--python", path.join(root, "scripts/render-robot-blender.py"), "--", manifest], { stdio: ["ignore", log.fd, log.fd] });
    child.on("error", reject);
    child.on("close", resolve);
  });
  await log.close();
  if (exitCode !== 0) throw new Error(`Blender exited ${exitCode}:\n${(await readFile(logPath, "utf8")).slice(-6000)}`);
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(frames[0].png).webp({ lossless: true, effort: 6 }).toFile(output);
  console.log(`Rendered actual runtime Minty to ${output}`);

  if (qaDirectory) {
    const background = "#f5f4ef";
    const label = (text, width, height = 28, color = "#24332b") => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="${width / 2}" y="${height - 8}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="13">${text}</text></svg>`);
    async function sheet(inputs, columns, width, height, filename, bg = background) {
      if (!inputs.length) return;
      await sharp({ create: { width: columns * width, height: Math.ceil(inputs.length / columns) * height, channels: 4, background: bg } })
        .composite(inputs.map((input, index) => ({ input, left: index % columns * width, top: Math.floor(index / columns) * height })))
        .png().toFile(path.join(qaDirectory, filename));
    }
    for (const group of ["expression", "startup"]) {
      const inputs = [];
      for (const frame of frames.filter(frame => frame.id.startsWith(group))) {
        await sharp(frame.png).toFile(path.join(qaDirectory, `${frame.id}.png`));
        inputs.push(await sharp(frame.png).resize(480, 240).flatten({ background })
          .extend({ top: 0, bottom: 28, left: 0, right: 0, background })
          .composite([{ input: label(frame.label, 480), top: 240, left: 0 }]).png().toBuffer());
      }
      await sheet(inputs, group === "expression" ? 4 : 3, 480, 268, `minty-${group}-pbr-qa.png`);
    }
    await sharp(frames[0].png).toFile(path.join(qaDirectory, "minty-poster-pbr.png"));
    const expressions = frames.filter(frame => frame.id.startsWith("expression"));
    const faceCrops = [];
    for (const frame of expressions) {
      // Consistent crop of the head region, enlarged only for contour inspection.
      // Actual-size sheets below remain the readability check.
      faceCrops.push(await sharp(frame.png).extract({ left: 225, top: 15, width: 195, height: 155 })
        .resize(390, 310).flatten({ background }).extend({ top: 0, bottom: 28, left: 0, right: 0, background })
        .composite([{ input: label(frame.label, 390), top: 310, left: 0 }]).png().toBuffer());
    }
    await sheet(faceCrops, 4, 390, 338, "minty-faces-enlarged-qa.png");
    for (const [width, height, bg, suffix] of [[200, 176, background, "mobile-light"], [200, 176, "#131a17", "mobile-dark"], [240, 208, background, "desktop-light"], [160, 140, background, "landscape-light"]]) {
      const zoom = Math.min(height / 3.1, width / 4.1);
      const projectedHeight = Math.round(zoom * 3.1);
      const projectedWidth = projectedHeight * 2;
      const inputs = [];
      for (const frame of expressions) {
        inputs.push(await sharp(frame.png).resize(projectedWidth, projectedHeight)
          .extract({ left: Math.floor((projectedWidth - width) / 2), top: 0, width, height: projectedHeight })
          .extend({ top: Math.floor((height - projectedHeight) / 2), bottom: Math.ceil((height - projectedHeight) / 2), left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .flatten({ background: bg }).extend({ bottom: 24, top: 0, left: 0, right: 0, background: bg })
          .composite([{ input: label(frame.label, width, 24, suffix.includes("dark") ? "#e0e8e1" : "#24332b"), top: height, left: 0 }]).png().toBuffer());
      }
      await sheet(inputs, 4, width, height + 24, `minty-expressions-${suffix}.png`, bg);
    }
    console.log(`PBR expression, pose and actual-size QA sheets: ${qaDirectory}`);
  }
} finally {
  rig?.dispose();
  await rm(temporary, { recursive: true, force: true });
}

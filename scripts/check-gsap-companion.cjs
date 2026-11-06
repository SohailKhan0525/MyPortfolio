/* Actual React/GSAP lifecycle and pixel-support bounds, without a browser/GPU.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-gsap-companion.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Module, createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const appRequire = createRequire(path.join(root, 'package.json'));
const dependency = name => require(path.join(process.env.PORTFOLIO_TEST_DEPS || path.join(root, 'node_modules'), name));
const { JSDOM } = dependency('jsdom');
const ts = dependency('typescript');
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { pretendToBeVisual: true, url: 'https://portfolio.test/' });
for (const key of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Event', 'CustomEvent']) global[key] = dom.window[key];
global.getComputedStyle = window.getComputedStyle.bind(window);
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let pageHidden = false;
Object.defineProperty(document, 'hidden', { get: () => pageHidden });
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
let failImage = false;
global.Image = class {
  complete = false; naturalWidth = 0;
  set src(value) {
    Promise.resolve().then(() => {
      if (failImage || !fs.existsSync(path.join(root, 'public', value))) { this.onerror?.(new Error('missing image')); return; }
      this.complete = true; this.naturalWidth = 384; this.onload?.();
    });
  }
};
const React = appRequire('react');
const { act } = React;
const { createRoot } = appRequire('react-dom/client');
const { gsap } = appRequire('gsap');
const { useGSAP } = appRequire('@gsap/react');
gsap.registerPlugin(useGSAP);
const timelines = [];
const realTimeline = gsap.timeline.bind(gsap);
gsap.timeline = options => { const tl = realTimeline(options); timelines.push(tl); return tl; };
let preference = { ready: true, reduced: false };
const originalLoad = Module._load;
Module._load = function(specifier, parent, isMain) {
  if (parent?.filename === path.join(root, 'app/RobotCompanion.tsx') && specifier === './gsap') return { gsap, useGSAP };
  if (parent?.filename === path.join(root, 'app/RobotCompanion.tsx') && specifier === './MotionPreferences') return { usePortfolioMotion: () => preference };
  return originalLoad.apply(this, arguments);
};
const originalTsx = Module._extensions['.tsx'];
Module._extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
Module._extensions['.css'] = () => {};
const Companion = appRequire('./app/RobotCompanion.tsx').default;
const sharp = appRequire('sharp');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/models/minty-gsap/manifest.json'), 'utf8'));
const roots = [];
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const render = async rootNode => { await act(async () => { rootNode.render(React.createElement(Companion)); await flush(); }); };
const opacity = node => Number(gsap.getProperty(node, 'opacity'));
const value = (node, property, fallback = 0) => Number(gsap.getProperty(node, property)) || fallback;
function transformed(point, node, origin, size) {
  const rad = value(node, 'rotation') * Math.PI / 180;
  const scale = value(node, 'scaleX', 1);
  const ox = origin[0] / 100 * size, oy = origin[1] / 100 * size;
  const x = (point[0] - ox) * scale, y = (point[1] - oy) * scale;
  return [ox + x * Math.cos(rad) - y * Math.sin(rad) + value(node, 'x') + value(node, 'xPercent') * size / 100,
    oy + x * Math.sin(rad) + y * Math.cos(rad) + value(node, 'y') + value(node, 'yPercent') * size / 100];
}
async function points(file) {
  const { data, info } = await sharp(path.join(root, 'public/models/minty-gsap', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = [];
  // Keep row endpoints of the visible alpha support; this is substantially
  // tighter than rotating a transparent rectangle around a shoulder pivot.
  for (let y = 0; y < info.height; y += 2) {
    let min = info.width, max = -1;
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 32) { min = Math.min(min, x); max = x; }
    if (max >= min) { result.push([min / info.width, y / info.height], [max / info.width, y / info.height]); }
  }
  return result;
}
(async () => {
  let bytes = 0;
  for (const file of manifest.files) { bytes += fs.statSync(path.join(root, 'public/models/minty-gsap', file)).size; }
  assert(bytes < 350_000, 'The full companion should stay under 350 KB');
  const source = fs.readFileSync(path.join(root, 'app/RobotCompanion.tsx'), 'utf8');
  assert(!/from ["'](?:three|@react-three|motion|lenis)/.test(source), 'No other rendering or motion engine');
  const rootNode = createRoot(document.getElementById('root')); roots.push(rootNode);
  await render(rootNode);
  const stage = document.querySelector('.robot-companion');
  assert.equal(stage.parentElement, document.body, 'Fixed companion must escape transformed app ancestors');
  assert.equal(stage.dataset.loaded, 'true');
  assert.equal(stage.querySelectorAll('canvas, video, button').length, 0);
  assert.equal(timelines.length, 2, 'Exactly one behavior timeline and one ambient timeline');
  const behavior = timelines[0], ambient = timelines[1];
  behavior.pause(); ambient.pause(0);
  const actor = stage.querySelector('.minty-actor');
  const layers = stage.querySelector('.minty-layers');
  const head = stage.querySelector('.minty-head');
  const left = stage.querySelector('.minty-left-arm');
  const right = stage.querySelector('.minty-right-arm');
  const body = stage.querySelector('.minty-body');
  const fullDuration = behavior.duration();
  assert(fullDuration > 10 && fullDuration < 16, 'Complete autonomous startup fits a bounded sequence');
  behavior.seek(0.7, false);
  assert(Math.abs(value(right, 'rotation')) > 90, 'Greeting really raises the shoulder arm');
  const supports = await Promise.all(['body.webp', 'left-arm.webp', 'right-arm.webp', 'head-smile.webp'].map(points));
  const stats = [];
  for (const [size, width] of [[208, 240], [156, 188], [124, 156]]) {
    let lowX = Infinity, highX = -Infinity, lowY = Infinity, highY = -Infinity;
    for (let t = 0; t < fullDuration - 0.01; t += 0.07) {
      behavior.seek(t, false);
      if (opacity(layers) < 0.5) continue;
      for (const [index, node] of [body, left, right, head].entries()) {
        const origin = index === 1 ? manifest.pivots.leftArm : index === 2 ? manifest.pivots.rightArm : manifest.pivots.head;
        for (const p of supports[index]) {
          let point = p.map(v => v * size);
          if (index !== 0) point = transformed(point, node, origin, size);
          point = transformed(point, layers, manifest.pivots.body, size);
          point = transformed(point, actor, manifest.pivots.body, size);
          point[0] += (width - size) / 2;
          lowX = Math.min(lowX, point[0]); highX = Math.max(highX, point[0]);
          lowY = Math.min(lowY, point[1]); highY = Math.max(highY, point[1]);
        }
      }
    }
    stats.push({ size, width, lowX, highX, lowY, highY });
    assert(lowX >= -1 && highX <= width + 1 && lowY >= -1 && highY <= size + 1, `Visible pixels stay inside ${width}×${size}: ${JSON.stringify(stats.at(-1))}`);
  }
  const originalRandom = Math.random;
  const seen = new Set();
  try {
    for (let cycle = 0; cycle < 50; cycle++) {
      Math.random = () => ((cycle % 10) + 0.1) / 10;
      behavior.totalTime(behavior.duration(), false).pause();
      assert(behavior.getChildren(true, true, true).length < 70, 'Completed sequences are cleared, not accumulated');
      assert(behavior.duration() > 3 && behavior.duration() < 12, 'Random behavior stays bounded');
      behavior.seek(Math.max(0, behavior.duration() - 0.3), false);
      seen.add(stage.dataset.behavior);
      const visibleFaces = [...stage.querySelectorAll('[data-expression]')].filter(node => opacity(node) > 0.5);
      assert.equal(visibleFaces.length, 1, 'Expression changes never layer two faces');
    }
  } finally { Math.random = originalRandom; }
  assert(seen.size >= 7, `Autonomous behavior variety was exercised: ${[...seen]}`);
  await act(async () => { pageHidden = true; document.dispatchEvent(new Event('visibilitychange')); });
  assert(behavior.paused() && ambient.paused(), 'Hidden page pauses all animation clocks');
  await act(async () => { pageHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  assert(!behavior.paused() && !ambient.paused(), 'Returning resumes existing behavior');
  await act(async () => { window.dispatchEvent(new CustomEvent('portfolio:menu-state', { detail: { open: true } })); });
  assert(behavior.paused() && ambient.paused());
  assert.equal(stage.dataset.menuOpen, 'true');
  await act(async () => { window.dispatchEvent(new CustomEvent('portfolio:menu-state', { detail: { open: false } })); });
  preference = { ready: true, reduced: true };
  await render(rootNode);
  assert.equal(stage.dataset.behavior, 'rest');
  assert.equal(value(actor, 'rotation'), 0, 'Reduced motion immediately stands Minty up');
  assert.equal(opacity(stage.querySelector('[data-expression="smile"]')), 1);
  assert(!behavior.parent && !ambient.parent, 'Preference change kills both timelines');
  await act(async () => rootNode.unmount());
  assert(!document.querySelector('.robot-companion'));
  failImage = true;
  const failRoot = createRoot(document.getElementById('root')); roots.push(failRoot);
  await render(failRoot);
  assert.equal(document.querySelector('.robot-companion').dataset.failed, 'true');
  assert(document.querySelector('.robot-poster'), 'Failed assets show the already existing 3D poster');
  await act(async () => failRoot.unmount());
  console.log(JSON.stringify({ result: 'GSAP companion checks passed', bytes, startupSeconds: fullDuration, autonomousCycles: 50, behaviors: [...seen], pixelBounds: stats }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  gsap.globalTimeline.clear(); gsap.ticker.sleep();
  Module._load = originalLoad;
  Module._extensions['.tsx'] = originalTsx;
  dom.window.close();
});

/*
 * The actual RobotScene React component with a controlled renderer boundary.
 * This exercises compile/frame/readiness ordering and cleanup, not GPU pixels.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules \
 *   node scripts/check-robot-scene.cjs
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Module, createRequire } = require("node:module");
const repository = path.resolve(__dirname, "..");
const requireApp = createRequire(path.join(repository, "package.json"));
const dependency = name => require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = dependency("jsdom");
const ts = dependency("typescript");
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "https://portfolio.test/", pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
let nextRAF = 0;
const pendingRAF = new Map();
global.requestAnimationFrame = callback => { pendingRAF.set(++nextRAF, callback); return nextRAF; };
global.cancelAnimationFrame = id => pendingRAF.delete(id);

require.extensions[".ts"] = require.extensions[".tsx"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
};
const React = requireApp("react");
const { act } = React;
const { createRoot } = requireApp("react-dom/client");
const jsxRuntime = requireApp("react/jsx-runtime");
const Three = requireApp("three");
const { Group, Scene, Texture, OrthographicCamera } = Three;
const loaderScene = new Group();
let frame;
let canvasProps;
let invalidations = 0;
let readyCalls = 0;
let errors = 0;
let poseApplications = 0;
let lastPose;
let disposals = 0;
let compileCalls = [];
const studios = [];
const generators = [];
const environmentTargets = [];
const dprChanges = [];
let failEnvironment = false;
class Studio {
  constructor() { this.disposals = 0; studios.push(this); }
  dispose() { this.disposals++; }
}
class Prefilter {
  constructor(renderer) { assert.equal(renderer, state.gl); this.disposals = 0; generators.push(this); }
  fromScene(studio, sigma, near, far, options) {
    assert.equal(studio.disposals, 0, "Capture scene is alive during prefiltering");
    assert.equal(options.size, 128, "Environment budget is bounded");
    assert(sigma > 0 && near > 0 && far > near);
    if (failEnvironment) throw new Error("Environment prefilter failed");
    const target = { texture: new Texture(), disposals: 0, dispose() { this.disposals++; } };
    environmentTargets.push(target);
    return target;
  }
  dispose() { this.disposals++; }
}
const canvas = document.createElement("canvas");
const contextListeners = new Set();
const addListener = canvas.addEventListener.bind(canvas);
const removeListener = canvas.removeEventListener.bind(canvas);
canvas.addEventListener = (type, listener, ...rest) => {
  if (type === "webglcontextlost") contextListeners.add(listener);
  addListener(type, listener, ...rest);
};
canvas.removeEventListener = (type, listener, ...rest) => {
  if (type === "webglcontextlost") contextListeners.delete(listener);
  removeListener(type, listener, ...rest);
};
const state = {
  gl: {
    domElement: canvas,
    compileAsync(world, camera) {
      assert.equal(world, state.scene, "Compile includes the actual scene lighting");
      assert.equal(camera, state.camera, "Compile uses the fitted camera");
      assert.equal(world.environment, environmentTargets.at(-1).texture, "Environment exists before shader preparation");
      assert.equal(world.environmentIntensity, 0.55);
      return new Promise((resolve, reject) => compileCalls.push({ resolve, reject }));
    },
  },
  invalidate: () => { invalidations++; },
  camera: new OrthographicCamera(),
  size: { width: 292, height: 216 },
  scene: new Scene(),
};
const mockFiber = {
  Canvas(props) {
    if (canvasProps && canvasProps.dpr !== props.dpr) dprChanges.push(props.dpr);
    canvasProps = props;
    // Lights/primitive are renderer host nodes. Only mount the React subtree.
    return React.createElement(React.Fragment, null,
      React.Children.toArray(props.children).filter(child => typeof child.type !== "string"));
  },
  useThree: () => state,
  useLoader(_, url) {
    assert.equal(url, "/models/minty_robot_v2.glb");
    return { scene: loaderScene };
  },
  useFrame(callback) {
    const latest = React.useRef(callback);
    latest.current = callback;
    React.useLayoutEffect(() => {
      frame = (...args) => latest.current(...args);
      return () => { frame = undefined; };
    }, []);
  },
};
const load = Module._load;
Module._load = function(name, parent, main) {
  if (name === "@react-three/fiber") return mockFiber;
  if (name === "three/addons/loaders/GLTFLoader.js") return { GLTFLoader: class {} };
  if (name === "three/addons/environments/RoomEnvironment.js") return { RoomEnvironment: Studio };
  if (name === "three" && parent?.filename.endsWith("RobotScene.tsx")) return { ...Three, PMREMGenerator: Prefilter };
  if (name === "./rig" && parent?.filename.endsWith("RobotScene.tsx")) return {
    createRobotRig() {
      return {
        root: new Group(),
        applyPose(pose) { poseApplications++; lastPose = { ...pose }; },
        dispose() { disposals++; },
      };
    },
  };
  if (name === "react/jsx-runtime" && parent?.filename.endsWith("RobotScene.tsx")) {
    const host = original => (type, props, key) => type === "primitive"
      ? original("div", { "data-three-host": "primitive" }, key) : original(type, props, key);
    return { ...jsxRuntime, jsx: host(jsxRuntime.jsx), jsxs: host(jsxRuntime.jsxs) };
  }
  return load.call(this, name, parent, main);
};
const RobotScene = requireApp(path.join(repository, "app/robot/RobotScene.tsx")).default;
const onReady = () => { readyCalls++; };
const onError = () => { errors++; };
let root;
let props = { active: false, reduced: false, onReady, onError };
const render = async (changes = {}, strict = false) => {
  props = { ...props, ...changes };
  const component = React.createElement(RobotScene, props);
  await act(async () => root.render(strict ? React.createElement(React.StrictMode, null, component) : component));
};
const mount = async (strict = false) => {
  props = { active: false, reduced: false, onReady, onError };
  root = createRoot(document.getElementById("root"));
  await render({}, strict);
};
const tick = async (delta = 1 / 60) => {
  assert(frame, "The scene subscribed to renderer frames");
  await act(async () => frame(state, delta));
};
const flushRAF = async () => {
  const queued = [...pendingRAF.values()];
  pendingRAF.clear();
  await act(async () => queued.forEach(callback => callback(100)));
};
const unmount = async () => { await act(async () => root.unmount()); root = undefined; };

(async () => {
  try {
    await mount();
    assert.equal(canvasProps.frameloop, "demand", "An unrevealed model cannot run continuously");
    assert.equal(canvasProps.resize.scroll, false, "Scroll does not trigger canvas layout measurement");
    assert.equal(canvasProps.dpr, 2, "Crisp 2x initial buffer without a 4K canvas");
    assert.equal(canvasProps.gl.antialias, true);
    assert.equal(canvasProps.gl.toneMapping, Three.ACESFilmicToneMapping);
    assert.equal(canvasProps.gl.outputColorSpace, Three.SRGBColorSpace);
    assert.equal(studios[0].disposals, 1, "Capture geometry is released after environment generation");
    assert.equal(generators[0].disposals, 1, "Temporary prefilter resources are released");
    assert.equal(environmentTargets[0].disposals, 0, "Environment remains alive during playback");
    assert.equal(compileCalls.length, 1);
    const staticPose = { ...lastPose };
    const initialApplications = poseApplications;
    await tick(10);
    assert.equal(poseApplications, initialApplications, "Uncompiled scene cannot advance its greeting");
    assert.equal(readyCalls, 0);
    await act(async () => compileCalls[0].resolve());
    const beforeWarmup = invalidations;
    await tick();
    assert.equal(readyCalls, 0);
    assert.equal(pendingRAF.size, 0, "One completed frame is not enough for reveal");
    assert(invalidations > beforeWarmup, "Demand mode schedules its second warmup frame");
    await tick();
    assert.equal(readyCalls, 0, "Readiness waits for a post-render RAF");
    assert.equal(pendingRAF.size, 1);
    await flushRAF();
    assert.equal(readyCalls, 1);
    assert.deepEqual(lastPose, staticPose, "Warmup leaves the greeting at its initial smile");
    await tick();
    assert.equal(readyCalls, 1, "Prepared scene announces readiness only once");

    await render({ active: true });
    assert.equal(canvasProps.frameloop, "always");
    await tick(20);
    assert.deepEqual(lastPose, staticPose, "First visible frame discards hidden wall-clock time");
    for (let i = 0; i < 12; i++) await tick();
    assert(lastPose.rightArm > 0, "The visible greeting begins naturally after reveal");
    const paused = { ...lastPose };
    await render({ active: false });
    await tick(10);
    assert.deepEqual(lastPose, paused, "Inactive rendering preserves the current pose");
    await render({ active: true });
    await tick(10);
    assert.deepEqual(lastPose, paused, "Resuming does not jump ahead by paused time");
    await render({ reduced: true, active: false });
    assert.equal(lastPose.bodyRoll, 0);
    assert.equal(lastPose.rightArm, 0);
    assert.equal(lastPose.expression, "smile");
    assert.equal(canvas.dataset.robotState, "resting");
    assert.equal(compileCalls.length, 1, "Playback gates do not recompile the scene");
    assert.equal(dprChanges.length, 0, "Warmup, hidden time and reduced pose never lower quality");
    await render({ reduced: false, active: true });
    await tick(10);
    for (let i = 0; i < 180; i++) await tick(1 / 30);
    assert.deepEqual(dprChanges, [1.5], "Sustained slow active frames lower DPR once");
    assert.equal(canvasProps.dpr, 1.5, "Selected tier is persisted in the Canvas prop for Fiber configuration");
    await render({ active: false });
    for (let i = 0; i < 40; i++) await tick(1);
    assert.deepEqual(dprChanges, [1.5], "Inactive frames cannot use the quality budget");
    assert.equal(canvasProps.dpr, 1.5, "Visibility changes cannot restore the higher DPR");
    await unmount();
    assert.equal(contextListeners.size, 0);
    assert.equal(pendingRAF.size, 0);
    assert(disposals > 0);
    assert.equal(state.scene.environment, null, "Environment ownership restores the previous scene state");
    assert.equal(state.scene.environmentIntensity, 1);
    assert.equal(environmentTargets[0].disposals, 1);

    const priorReady = readyCalls;
    await mount();
    const orphanCompile = compileCalls.at(-1);
    await unmount();
    await act(async () => orphanCompile.resolve());
    await flushRAF();
    assert.equal(readyCalls, priorReady, "Unmount during compilation cancels late readiness");
    assert.equal(pendingRAF.size, 0);

    await mount();
    await act(async () => compileCalls.at(-1).resolve());
    await tick();
    await tick();
    assert.equal(pendingRAF.size, 1);
    await unmount();
    assert.equal(pendingRAF.size, 0, "Unmount cancels the pending reveal frame");
    await flushRAF();
    assert.equal(readyCalls, priorReady);

    await mount();
    await act(async () => compileCalls.at(-1).reject(new Error("Shader compilation failed")));
    assert.equal(errors, 1, "Compilation failure selects the wrapper fallback");
    assert.equal(readyCalls, priorReady);
    const lost = new dom.window.Event("webglcontextlost", { cancelable: true });
    await act(async () => canvas.dispatchEvent(lost));
    assert(lost.defaultPrevented, "Context loss is handled without destroying the page");
    assert.equal(errors, 2);
    await unmount();

    const beforeFailedEnvironment = compileCalls.length;
    failEnvironment = true;
    await mount();
    assert.equal(errors, 3, "Synchronous environment failure selects fallback");
    assert.equal(compileCalls.length, beforeFailedEnvironment, "No partial environment is compiled");
    assert.equal(studios.at(-1).disposals, 1);
    assert.equal(generators.at(-1).disposals, 1);
    await unmount();
    failEnvironment = false;

    const strictStart = compileCalls.length;
    await mount(true);
    assert.equal(compileCalls.length, strictStart + 2, "Strict Mode rehearses mount cleanup");
    await act(async () => compileCalls[strictStart].resolve());
    await tick();
    await tick();
    assert.equal(pendingRAF.size, 0, "The cancelled Strict Mode warmup cannot reveal the model");
    await act(async () => compileCalls[strictStart + 1].resolve());
    await tick();
    await tick();
    await flushRAF();
    assert.equal(readyCalls, priorReady + 1, "The live Strict Mode warmup announces exactly once");
    await unmount();
    assert(studios.every(resource => resource.disposals === 1), "Every studio is disposed exactly once");
    assert(generators.every(resource => resource.disposals === 1), "Every generator is disposed exactly once");
    assert(environmentTargets.every(resource => resource.disposals === 1), "Every owned environment is disposed exactly once, including Strict Mode");
    assert.equal(state.scene.environment, null);
    console.log("PASS: real RobotScene environment-before-compile ordering, bounded studio ownership/disposal, 2x antialiasing, sustained active-frame DPR adaptation, two-frame reveal, hidden greeting prevention, paused-clock resume, reduced pose, environment/compile/context failures, RAF cancellation and Strict Mode cleanup. Renderer hooks are controlled; GPU pixels are not tested here.");
  } finally {
    if (root) await unmount();
    Module._load = load;
    assert.equal(pendingRAF.size, 0);
    assert.equal(contextListeners.size, 0);
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

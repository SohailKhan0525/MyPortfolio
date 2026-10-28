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
const { Group, OrthographicCamera } = requireApp("three");
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
      return new Promise((resolve, reject) => compileCalls.push({ resolve, reject }));
    },
  },
  invalidate: () => { invalidations++; },
  camera: new OrthographicCamera(),
  size: { width: 292, height: 216 },
  scene: new Group(),
};
const mockFiber = {
  Canvas(props) {
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
    await unmount();
    assert.equal(contextListeners.size, 0);
    assert.equal(pendingRAF.size, 0);
    assert(disposals > 0);

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
    console.log("PASS: real RobotScene shader warmup ordering, two-frame reveal, hidden greeting prevention, paused-clock resume, reduced pose, compile/context failures, RAF cancellation and Strict Mode cleanup. Renderer hooks are controlled; GPU pixels are not tested here.");
  } finally {
    if (root) await unmount();
    Module._load = load;
    assert.equal(pendingRAF.size, 0);
    assert.equal(contextListeners.size, 0);
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

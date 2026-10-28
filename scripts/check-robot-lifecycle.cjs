/*
 * Real React, motion preferences, and shared scroll activity, with only the heavy
 * WebGL scene replaced by a lifecycle probe. Geometry/framing require the rig
 * regression and a browser; this check deliberately does not claim GPU coverage.
 *
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules \
 *   node scripts/check-robot-lifecycle.cjs
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
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://portfolio.test/", pretendToBeVisual: true,
});
for (const name of ["window", "document", "HTMLElement", "SVGElement", "Element", "Node", "NodeList", "EventTarget", "AbortController", "AbortSignal", "localStorage"]) {
  global[name] = dom.window[name];
}
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
global.IS_REACT_ACT_ENVIRONMENT = true;

let pageHidden = false;
Object.defineProperty(document, "hidden", { get: () => pageHidden, configurable: true });
const mediaListeners = new Set();
const media = {
  matches: false, media: "(prefers-reduced-motion: reduce)",
  addEventListener(_, callback) { mediaListeners.add(callback); },
  removeEventListener(_, callback) { mediaListeners.delete(callback); },
  addListener(callback) { mediaListeners.add(callback); },
  removeListener(callback) { mediaListeners.delete(callback); },
};
window.matchMedia = () => media;

const scrollListeners = new Set();
const addWindowListener = window.addEventListener.bind(window);
const removeWindowListener = window.removeEventListener.bind(window);
window.addEventListener = (type, listener, options) => {
  if (type === "scroll") {
    assert.equal(options?.passive, true, "Scroll work must use a passive subscription");
    scrollListeners.add(listener);
  }
  return addWindowListener(type, listener, options);
};
window.removeEventListener = (type, listener, options) => {
  if (type === "scroll") scrollListeners.delete(listener);
  return removeWindowListener(type, listener, options);
};
const visibilityListeners = new Set();
const addDocumentListener = document.addEventListener.bind(document);
const removeDocumentListener = document.removeEventListener.bind(document);
document.addEventListener = (type, listener, options) => {
  if (type === "visibilitychange") visibilityListeners.add(listener);
  return addDocumentListener(type, listener, options);
};
document.removeEventListener = (type, listener, options) => {
  if (type === "visibilitychange") visibilityListeners.delete(listener);
  return removeDocumentListener(type, listener, options);
};

const observations = new Set();
global.IntersectionObserver = window.IntersectionObserver = class {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.targets = new Set();
    observations.add(this);
  }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); observations.delete(this); }
};
const intersect = (preload, ratio) => {
  const observer = [...observations].find(item => Boolean(item.options.rootMargin) === preload);
  assert(observer, `Missing ${preload ? "preload" : "visibility"} observer`);
  const target = [...observer.targets][0];
  observer.callback([{ target, isIntersecting: ratio > 0, intersectionRatio: ratio }]);
};

require.extensions[".css"] = () => {};
require.extensions[".ts"] = require.extensions[".tsx"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    },
  }).outputText, filename);
};
const React = requireApp("react");
const { act } = React;
const { createRoot } = requireApp("react-dom/client");
const { renderToString } = requireApp("react-dom/server");
let sceneMounts = 0;
let sceneUnmounts = 0;
let sceneProps;
function SceneProbe(props) {
  sceneProps = props;
  React.useEffect(() => {
    sceneMounts++;
    return () => { sceneUnmounts++; };
  }, []);
  return React.createElement("div", { className: "scene-probe", "data-playing": props.active, "data-reduced": props.reduced });
}
const load = Module._load;
Module._load = function (name, parent, main) {
  if (name === "next/dynamic") return (_, options) => {
    assert.equal(options.ssr, false, "The WebGL scene must remain client-only");
    return SceneProbe;
  };
  return load.call(this, name, parent, main);
};
const Provider = requireApp(path.join(repository, "app/MotionPreferences.tsx")).default;
const RobotCompanion = requireApp(path.join(repository, "app/RobotCompanion.tsx")).default;
const application = () => React.createElement(Provider, null, React.createElement(RobotCompanion));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const motionPreference = reduced => {
  media.matches = reduced;
  for (const callback of mediaListeners) callback({ matches: reduced });
};

(async () => {
  let root;
  try {
    const server = renderToString(application());
    assert(server.includes('class="robot-companion"'), "SSR reserves the robot's layout");
    assert(server.includes("/models/minty-robot-poster.webp"), "SSR includes the actual-model poster");
    assert(server.includes('width="640" height="320"'), "Poster has intrinsic dimensions before hydration");
    assert(!server.includes("scene-probe"), "SSR does not render the WebGL scene");
    assert(!server.includes("<button"), "Robot has no manual controls");
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(application()));
    const host = document.querySelector(".robot-companion");
    assert.equal(sceneMounts, 0, "An offscreen hero does not load the scene eagerly");
    assert.equal(host.dataset.active, "false");
    assert.equal(scrollListeners.size, 1, "Robot joins one shared scroll subscription");

    await act(async () => intersect(true, 1));
    assert.equal(sceneMounts, 1, "Approaching the viewport loads the scene once");
    assert.equal(sceneProps.active, false, "Preloading alone does not start its story offscreen");
    await act(async () => intersect(false, 0.1));
    assert.equal(sceneProps.active, false, "A barely visible edge does not consume animation frames");
    await act(async () => intersect(false, 1));
    assert.equal(sceneProps.active, true, "Visible robot starts without interaction");
    assert.equal(host.dataset.loaded, "false", "Poster stays until the first rendered model frame");
    await act(async () => sceneProps.onReady());
    assert.equal(host.dataset.loaded, "true");

    const mountedScene = document.querySelector(".scene-probe");
    await act(async () => {
      for (let i = 0; i < 40; i++) window.dispatchEvent(new dom.window.Event("scroll"));
    });
    assert.equal(sceneProps.active, false, "Native scrolling gets the frame budget");
    assert.equal(host.dataset.loaded, "true", "Pause retains the rendered robot");
    await act(async () => wait(200));
    assert.equal(sceneProps.active, true, "Robot resumes after scrolling settles");
    assert.equal(document.querySelector(".scene-probe"), mountedScene, "Scrolling must not recreate the expensive scene");
    assert.equal(sceneMounts, 1);

    await act(async () => {
      pageHidden = true;
      document.dispatchEvent(new dom.window.Event("visibilitychange"));
    });
    assert.equal(sceneProps.active, false, "Hidden tabs stop animation");
    await act(async () => {
      pageHidden = false;
      document.dispatchEvent(new dom.window.Event("visibilitychange"));
    });
    assert.equal(sceneProps.active, true);
    await act(async () => intersect(false, 0));
    assert.equal(sceneProps.active, false, "Offscreen robot stops animation");
    await act(async () => intersect(false, 1));
    assert.equal(sceneProps.active, true);

    await act(async () => motionPreference(true));
    assert.equal(sceneProps.active, false, "Live reduced-motion preference stops frames");
    assert.equal(sceneProps.reduced, true, "Scene receives the static-pose instruction");
    assert.equal(host.dataset.loaded, "true", "Reduced motion still shows the robot");
    await act(async () => motionPreference(false));
    assert.equal(sceneProps.active, true, "Restoring motion works without reloading");
    assert.equal(sceneProps.reduced, false);
    assert.equal(document.querySelector(".scene-probe"), mountedScene, "Preference changes retain the same scene");
    assert.equal(host.querySelectorAll("button, input, audio").length, 0, "No controls or sound were added");

    await act(async () => sceneProps.onError());
    assert.equal(host.dataset.loaded, "false", "WebGL/context failure restores the supplied-model poster");
    assert.equal(host.dataset.active, "false");
    assert.equal(document.querySelector(".scene-probe"), null);
    assert.equal(sceneUnmounts, 1, "Failed scene releases its mounted resources");
    console.log("PASS: robot SSR poster, client-only lazy scene, autonomous entry, shared passive scroll pause/resume, offscreen/hidden pause, live reduced motion, stable scene identity, fallback and no controls. WebGL geometry is tested separately.");
  } finally {
    if (root) await act(async () => root.unmount());
    assert.equal(scrollListeners.size, 0, "Unmount removes the shared scroll listener");
    assert.equal(visibilityListeners.size, 0, "Unmount removes the visibility listener");
    assert.equal(observations.size, 0, "Unmount disconnects both viewport observers");
    assert.equal(mediaListeners.size, 0, "Unmount releases the motion preference subscription");
    Module._load = load;
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

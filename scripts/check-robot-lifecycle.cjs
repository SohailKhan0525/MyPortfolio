/*
 * Real React, body portals, and motion preferences, with only the heavy
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
const dom = new JSDOM('<!doctype html><html><body><div id="root" style="transform:translateY(0);filter:opacity(1)"></div></body></html>', {
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
const { createRoot, hydrateRoot } = requireApp("react-dom/client");
const { renderToString } = requireApp("react-dom/server");
let sceneMounts = 0;
let sceneUnmounts = 0;
let sceneProps;
let sceneRenders = 0;
function SceneProbe(props) {
  sceneProps = props;
  sceneRenders++;
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
const motionPreference = reduced => {
  media.matches = reduced;
  for (const callback of mediaListeners) callback({ matches: reduced });
};

(async () => {
  let root;
  try {
    const server = renderToString(application());
    assert(!server.includes('class="robot-companion"'), "SSR must not put a floating companion inside the hero layout");
    assert(!server.includes("<img"), "SSR must not flash a different robot image before the 3D model");
    assert(!server.includes("scene-probe"), "SSR does not render the WebGL scene");
    assert(!server.includes("<button"), "Robot has no manual controls");
    document.getElementById("root").innerHTML = server;
    const hydrationErrors = [];
    await act(async () => {
      root = hydrateRoot(document.getElementById("root"), application(), {
        onRecoverableError: error => hydrationErrors.push(error),
      });
    });
    assert.deepEqual(hydrationErrors, [], "The client-only body portal introduces no hydration mismatch");
    const host = document.querySelector(".robot-companion");
    assert(host, "Hydration mounts the floating stage");
    assert.equal(host.parentElement, document.body, "Portal escapes transformed page ancestors so fixed really follows the viewport");
    assert.equal(document.getElementById("root").querySelector(".robot-companion"), null, "No obsolete hero slot or second robot remains");
    assert.equal(sceneMounts, 1, "The fixed, onscreen companion loads automatically after hydration");
    assert.equal(host.dataset.active, "false");
    assert.equal(host.querySelector("img"), null, "Hydration cannot introduce the old loading poster");
    assert.equal(scrollListeners.size, 0, "Scrolling does not subscribe the fixed companion to pause/resume work");
    assert.equal(observations.size, 0, "A fixed companion does not depend on a scrolled-away hero intersection");
    assert.equal(sceneProps.active, false, "The greeting waits until a complete model frame is ready");
    assert.equal(host.dataset.loaded, "false");
    assert.equal(host.querySelector("img"), null, "A slow model load cannot flash a mismatched face or pose");
    await act(async () => sceneProps.onReady());
    assert.equal(host.dataset.loaded, "true");
    assert.equal(sceneProps.active, true, "Ready robot starts automatically without interaction");
    assert.equal(host.querySelector("img"), null, "The live scene never swaps from an unrelated poster");

    const mountedScene = document.querySelector(".scene-probe");
    const renderedBeforeScroll = sceneRenders;
    await act(async () => {
      for (let i = 0; i < 40; i++) window.dispatchEvent(new dom.window.Event("scroll"));
    });
    assert.equal(sceneProps.active, true, "Robot continues its autonomous story during native scrolling");
    assert.equal(host.dataset.loaded, "true", "Scrolling retains the rendered robot");
    assert.equal(sceneRenders, renderedBeforeScroll, "Scroll events cause no React updates to the companion");
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

    await act(async () => motionPreference(true));
    assert.equal(sceneProps.active, false, "Live reduced-motion preference stops frames");
    assert.equal(sceneProps.reduced, true, "Scene receives the static-pose instruction");
    assert.equal(host.dataset.loaded, "true", "Reduced motion still shows the robot");
    await act(async () => motionPreference(false));
    assert.equal(sceneProps.active, true, "Restoring motion works without reloading");
    assert.equal(sceneProps.reduced, false);
    assert.equal(document.querySelector(".scene-probe"), mountedScene, "Preference changes retain the same scene");
    assert.equal(host.querySelectorAll("button, input, audio").length, 0, "No controls or sound were added");

    const lateReady = sceneProps.onReady;
    await act(async () => sceneProps.onError());
    assert.equal(host.dataset.loaded, "false", "WebGL/context failure restores the supplied-model poster");
    assert.equal(host.dataset.failed, "true");
    assert.equal(host.dataset.active, "false");
    assert.equal(document.querySelector(".scene-probe"), null);
    assert.equal(sceneUnmounts, 1, "Failed scene releases its mounted resources");
    const fallback = host.querySelector("img.robot-poster");
    assert(fallback, "A real renderer failure supplies a static robot instead of an empty stage");
    assert.equal(fallback.getAttribute("src"), "/models/minty-robot-still.webp", "Fallback uses the updated rig and face");
    assert.equal(fallback.getAttribute("width"), "640");
    assert.equal(fallback.getAttribute("height"), "320");
    await act(async () => lateReady());
    assert.equal(host.dataset.loaded, "false", "Late warmup completion cannot reveal a failed canvas");
    assert.equal(host.dataset.active, "false", "Late readiness cannot restart a failed renderer");
    assert.equal(host.querySelector("img.robot-poster"), fallback, "Late readiness retains the same fallback");
    assert.equal(sceneMounts, 1, "Failure does not trigger repeated renderer creation");

    // Also exercise failure before readiness, when an outstanding shader warmup
    // may still complete after the scene has already been removed.
    await act(async () => root.unmount());
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(application()));
    const pendingHost = document.querySelector(".robot-companion");
    const pendingReady = sceneProps.onReady;
    assert.equal(sceneProps.active, false, "The second greeting is still waiting for warmup");
    assert.equal(pendingHost.querySelector("img"), null);
    await act(async () => sceneProps.onError());
    const pendingFallback = pendingHost.querySelector("img.robot-poster");
    assert(pendingFallback, "Initial renderer failure also receives the static robot");
    await act(async () => pendingReady());
    assert.equal(pendingHost.dataset.loaded, "false");
    assert.equal(pendingHost.dataset.active, "false");
    assert.equal(pendingHost.querySelector("img.robot-poster"), pendingFallback);
    assert.equal(sceneMounts, 2);
    assert.equal(sceneUnmounts, 2);
    console.log("PASS: hydration-safe body portal outside transformed ancestors, no hero slot or loading poster flash, readiness-gated automatic greeting, uninterrupted scrolling without subscriptions/React rerenders, hidden-tab pause, live reduced motion, stable scene identity, error-only fallback, late readiness protection and no controls. WebGL geometry is tested separately.");
  } finally {
    if (root) await act(async () => root.unmount());
    assert.equal(scrollListeners.size, 0, "No companion scroll subscriptions remain");
    assert.equal(visibilityListeners.size, 0, "Unmount removes the visibility listener");
    assert.equal(observations.size, 0, "No obsolete hero intersection observers remain");
    assert.equal(mediaListeners.size, 0, "Unmount releases the motion preference subscription");
    assert.equal(document.querySelector(".robot-companion"), null, "Unmount removes the body portal as well as its scene");
    Module._load = load;
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

/*
 * Regression check for Motion's hydration configuration.
 *
 * Test-only dependencies can live outside the app (no production dependencies):
 *   npm install --prefix /tmp/portfolio-motion-check jsdom@26.1.0 typescript@5.9.3
 *   PORTFOLIO_TEST_DEPS=/tmp/portfolio-motion-check/node_modules node scripts/check-motion.cjs
 *
 * This runs the real React + Motion runtime with a simulated DOM, not a mobile
 * browser. It must observe an intermediate transform, not merely a final style.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const repository = path.resolve(__dirname, "..");
const testDependency = name => require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = testDependency("jsdom");
const ts = testDependency("typescript");
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://portfolio.test/", pretendToBeVisual: true,
});
for (const name of ["window", "document", "HTMLElement", "SVGElement", "Element", "Node", "NodeList", "EventTarget", "AbortController", "AbortSignal", "localStorage"]) {
  global[name] = dom.window[name];
}
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16);
global.cancelAnimationFrame = clearTimeout;
window.requestAnimationFrame = global.requestAnimationFrame;
window.cancelAnimationFrame = global.cancelAnimationFrame;
global.IS_REACT_ACT_ENVIRONMENT = true;

const listeners = new Set();
const media = {
  matches: false, media: "(prefers-reduced-motion: reduce)",
  addListener(callback) { listeners.add(callback); },
  removeListener(callback) { listeners.delete(callback); },
  addEventListener(_, callback) { listeners.add(callback); },
  removeEventListener(_, callback) { listeners.delete(callback); },
};
window.matchMedia = () => media;
// The viewport is controlled without a browser so entry/re-entry is deterministic.
const observations = new Map();
global.IntersectionObserver = window.IntersectionObserver = class {
  constructor(callback) { this.callback = callback; this.targets = new Set(); }
  observe(target) { this.targets.add(target); observations.set(target, this); }
  unobserve(target) { this.targets.delete(target); observations.delete(target); }
  disconnect() { for (const target of this.targets) observations.delete(target); }
};
const intersect = (target, visible) => {
  const observer = observations.get(target);
  assert(observer, "Illustration must have its own viewport observer");
  observer.callback([{ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
};
require.extensions[".css"] = () => {};
require.extensions[".ts"] = require.extensions[".tsx"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    },
  });
  module._compile(outputText, filename);
};

const React = require("react");
const { act, useEffect, useState } = React;
const { createRoot } = require("react-dom/client");
const { renderToString } = require("react-dom/server");
const { animate, motion, useMotionValue } = require("motion/react");
const { default: PortfolioMotionProvider, usePortfolioMotion } = require(path.join(repository, "app/MotionPreferences.tsx"));
const ProjectIllustration = require(path.join(repository, "app/ProjectIllustration.tsx")).default;
const DataInstrument = require(path.join(repository, "app/DataInstrument.tsx")).default;
const wait = duration => new Promise(resolve => setTimeout(resolve, duration));

function TransformProbe() {
  const { ready, reduced } = usePortfolioMotion();
  const [target, setTarget] = useState(100);
  return React.createElement(motion.button, {
    id: "transform-probe", type: "button", initial: false,
    animate: { x: ready ? target : 0 },
    transition: { type: "tween", duration: reduced ? 0 : 0.7, ease: "linear" },
    onClick: () => setTarget(current => current + 100),
  }, "Motion probe");
}
function MotionValueProbe() {
  const { ready, reduced } = usePortfolioMotion();
  const x = useMotionValue(0);
  useEffect(() => {
    if (!ready) return;
    if (reduced) { x.set(100); return; }
    const playback = animate(x, 100, { type: "tween", duration: 0.7, ease: "linear" });
    return () => playback.stop();
  }, [ready, reduced, x]);
  return React.createElement(motion.div, { id: "value-probe", style: { x } }, "MotionValue probe");
}
const application = () => React.createElement(PortfolioMotionProvider, null,
  React.createElement(TransformProbe), React.createElement(MotionValueProbe),
  React.createElement(ProjectIllustration, { index: 0 }), React.createElement(DataInstrument));
const translation = id => {
  const value = document.getElementById(id).style.transform;
  if (!value || value === "none") return 0;
  const match = value.match(/translateX\(([-\d.]+)px\)/);
  assert(match, `Expected a measurable translateX, got ${value}`);
  return Number(match[1]);
};

(async () => {
  let root;
  try {
    const serverMarkup = renderToString(application());
    assert(serverMarkup.includes("Motion probe"), "Server-rendered content remains readable");
    assert(!serverMarkup.match(/<button[^>]*>/)[0].includes("opacity:0"), "Server output must not hide the readable control");
    assert(serverMarkup.includes("An architectural house drawing"), "Initial project illustration is present on the server");
    localStorage.setItem("portfolio-motion", "reduced");
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(application()));
    assert.equal(localStorage.getItem("portfolio-motion"), null, "Legacy pause is removed");
    await act(async () => wait(100));
    const componentX = translation("transform-probe");
    const valueX = translation("value-probe");
    assert(componentX > 0 && componentX < 95,
      `Hydration must not cache forced reduced motion: expected intermediate x, got ${componentX}`);
    assert(valueX > 0 && valueX < 95, `MotionValue must interpolate, got ${valueX}`);
    await act(async () => wait(750));
    assert.equal(translation("transform-probe"), 100, "Initial animation reaches its target");
    await act(async () => document.getElementById("transform-probe").click());
    await act(async () => wait(100));
    const interactionX = translation("transform-probe");
    assert(interactionX > 100 && interactionX < 195, "Subsequent interaction also animates");
    const instrument = document.querySelector(".data-instrument");
    await act(async () => intersect(instrument, true));
    await act(async () => wait(600));
    const record = instrument.querySelector('circle[cx="64"][r="9"]')?.closest("g");
    assert(record, "The hero record sequence must mount after viewport entry");
    const recordOpacity = Number(record.style.opacity);
    assert(recordOpacity > 0.5,
      `The moving hero record must be visible mid-sequence (got ${recordOpacity})`);
    const recordX = Number(record.style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1]);
    assert(recordX > 0 && recordX < 368, `The visible hero record must be moving along its route, got x=${recordX}`);

    // Crucially this is the default House illustration mounted BEFORE readiness,
    // not a newly selected/remounted project that would hide the hydration bug.
    const drawing = document.querySelector(".project-drawing");
    const illustrationY = () => {
      const transform = drawing.querySelector("g").style.transform;
      if (!transform || transform === "none") return 0;
      const match = transform.match(/translateY\(([-\d.]+)px\)/);
      assert(match, `Expected the House arrival translation, got ${transform}`);
      return Number(match[1]);
    };
    await act(async () => intersect(drawing, true));
    await act(async () => wait(100));
    const firstY = illustrationY();
    assert(firstY > 0 && firstY < 12,
      `Initial project must actually interpolate on viewport entry, got y=${firstY}`);
    await act(async () => wait(950));
    assert.equal(illustrationY(), 0, "The illustration settles into its finished composition");
    await act(async () => intersect(drawing, false));
    await act(async () => wait(32));
    await act(async () => intersect(drawing, true));
    await act(async () => wait(100));
    const replayY = illustrationY();
    assert(replayY > 0 && replayY < 12,
      `The same mounted illustration must replay after leaving/returning, got y=${replayY}`);
    // Both scenes replay while still in view; no scroll or tap is needed.
    const firstHouse = drawing.querySelector("g");
    const firstRecord = instrument.querySelector('circle[cx="64"][r="9"]');
    await act(async () => wait(6750));
    await act(async () => wait(100));
    assert.notEqual(drawing.querySelector("g"), firstHouse, "The project must start another visible cycle");
    assert.notEqual(instrument.querySelector('circle[cx="64"][r="9"]'), firstRecord, "The hero trace must repeat while visible");
    const repeatedY = illustrationY();
    assert(repeatedY > 0 && repeatedY < 12, `The repeated project cycle must interpolate, got y=${repeatedY}`);

    const clickControl = label => {
      const button = document.querySelector(`button[aria-label="${label}"]`);
      assert(button, `Missing illustration control: ${label}`);
      button.click();
    };
    await act(async () => {
      clickControl("Pause project illustration animation");
      clickControl("Pause data record animation");
    });
    await act(async () => wait(32));
    assert.equal(illustrationY(), 0, "Pausing settles the complete project drawing");
    assert(!instrument.querySelector('circle[cx="64"][r="9"]'), "Pausing removes the moving hero overlay");
    await act(async () => {
      clickControl("Resume project illustration animation");
      clickControl("Resume data record animation");
    });
    await act(async () => wait(100));
    assert(illustrationY() > 0, "Resuming restarts the drawing");

    // Native scrolling gets the frame budget; decorative SVG cycles wait for idle.
    await act(async () => {
      for (let i = 0; i < 40; i++) window.dispatchEvent(new dom.window.Event("scroll"));
    });
    await act(async () => wait(32));
    assert(!instrument.querySelector('circle[cx="64"][r="9"]'), "Scrolling suspends the recurring hero overlay");
    assert.equal(illustrationY(), 0, "Scrolling settles the project drawing");
    await act(async () => wait(180));
    await act(async () => wait(100));
    assert(instrument.querySelector('circle[cx="64"][r="9"]'), "The hero resumes after native scrolling settles");
    assert(illustrationY() > 0, "The project starts a fresh cycle after scroll idle");

    // Android's setting can change while Chrome keeps this page mounted.
    const probeNode = document.getElementById("transform-probe");
    const changePreference = async reduced => act(async () => {
      media.matches = reduced;
      for (const callback of listeners) callback(media);
    });
    await changePreference(true);
    await act(async () => wait(32));
    assert.equal(document.documentElement.dataset.motion, "reduced");
    assert.equal(illustrationY(), 0, "A live OS change stops the project's spatial movement");
    assert(!instrument.querySelector('circle[cx="64"][r="9"]'), "Reduced motion stops the hero trace immediately");
    assert.equal(document.getElementById("transform-probe"), probeNode, "Preference changes must not remount page content");
    await changePreference(false);
    await act(async () => wait(100));
    assert.equal(document.documentElement.dataset.motion, "full");
    assert(illustrationY() > 0 && illustrationY() < 12, "Turning reduction off restores spatial movement without reload");
    assert(instrument.querySelector('circle[cx="64"][r="9"]'), "The hero trace resumes with full motion");
    await act(async () => probeNode.click());
    await act(async () => wait(100));
    assert(translation("transform-probe") > 200 && translation("transform-probe") < 295,
      "State survives preference changes and subsequent interactions interpolate");

    const visibility = async hidden => act(async () => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: hidden ? "hidden" : "visible" });
      document.dispatchEvent(new dom.window.Event("visibilitychange"));
    });
    await visibility(true);
    await act(async () => wait(32));
    assert(!instrument.querySelector('circle[cx="64"][r="9"]'), "Hidden tabs stop the recurring hero animation");
    assert.equal(illustrationY(), 0, "Hidden tabs settle the project drawing");
    await visibility(false);
    await act(async () => wait(100));
    assert(illustrationY() > 0, "Returning to Chrome starts a new visible drawing cycle");
    await act(async () => { intersect(drawing, false); intersect(instrument, false); });
    await act(async () => wait(32));
    assert(!instrument.querySelector('circle[cx="64"][r="9"]'), "Offscreen illustrations stop playback");
    assert.equal(illustrationY(), 0);

    // Also cover a fresh load with Android Remove animations already enabled.
    await act(async () => root.unmount());
    root = undefined;
    await changePreference(true);
    root = createRoot(document.getElementById("root"));
    await act(async () => root.render(application()));
    await act(async () => wait(100));
    assert.equal(translation("transform-probe"), 100, "Initial device preference skips spatial interpolation");
    await changePreference(false);
    await act(async () => document.getElementById("transform-probe").click());
    await act(async () => wait(100));
    assert(translation("transform-probe") > 100 && translation("transform-probe") < 195,
      "A component first mounted under reduced motion can animate after a live setting change");
    console.log("PASS: readable SSR, legacy pause migration, intermediate hydration and interaction transforms, MotionValues, repeated visible project/hero cycles, pause/resume, scroll-idle playback, viewport and tab visibility, and live reduced-motion changes in both directions without remounting.");
  } finally {
    if (root) await act(async () => root.unmount());
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

/*
 * Runs the actual pre-paint bootstrap and hydrates the real theme toggle.
 * Test-only dependencies (kept outside the production app):
 *   npm install --prefix /tmp/portfolio-check jsdom@26.1.0 typescript@5.9.3
 *   PORTFOLIO_TEST_DEPS=/tmp/portfolio-check/node_modules node scripts/check-theme-default.cjs
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const repository = path.resolve(__dirname, "..");
const testDependency = name => require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = testDependency("jsdom");
const ts = testDependency("typescript");
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
const { DEFAULT_THEME, THEME_COLORS, THEME_STORAGE_KEY, themeBootstrapScript } = require(path.join(repository, "app/theme-preference.ts"));

// Capture the theme as soon as the parser reaches body, before hydration. Even
// an OS dark preference must not override the site's light default.
for (const [saved, blocked, expected] of [
  [null, false, "light"], ["light", false, "light"], ["dark", false, "dark"],
  ["system", false, "light"], ["", false, "light"], ["dark", true, "light"],
]) {
  const page = new JSDOM(`<!doctype html><html data-theme="${DEFAULT_THEME}"><head>
    <meta name="theme-color" content="${THEME_COLORS.light}">
    <script>${themeBootstrapScript}</script></head><body>
    <script>window.themeAtBody = document.documentElement.dataset.theme;</script>
    </body></html>`, {
    url: "https://portfolio.test/resume", runScripts: "dangerously",
    beforeParse(window) {
      window.matchMedia = () => ({ matches: true });
      if (saved !== null) window.localStorage.setItem(THEME_STORAGE_KEY, saved);
      if (blocked) Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
    },
  });
  assert.equal(page.window.themeAtBody, expected, `Pre-paint theme for saved=${saved}, blocked=${blocked}`);
  assert.equal(page.window.document.documentElement.style.colorScheme, expected);
  assert.equal(page.window.document.querySelector('meta[name="theme-color"]').content, THEME_COLORS[expected]);
  page.window.close();
}

const dom = new JSDOM('<!doctype html><html><head><meta name="theme-color"></head><body><div id="root"></div></body></html>', {
  url: "https://portfolio.test/", pretendToBeVisual: true, runScripts: "outside-only",
});
for (const name of ["window", "document", "HTMLElement", "SVGElement", "Element", "Node", "NodeList", "EventTarget", "AbortController", "AbortSignal"]) {
  global[name] = dom.window[name];
}
Object.defineProperty(global, "localStorage", { configurable: true, get: () => window.localStorage });
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 16);
global.cancelAnimationFrame = clearTimeout;
window.requestAnimationFrame = global.requestAnimationFrame;
window.cancelAnimationFrame = global.cancelAnimationFrame;
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = query => ({
  matches: query === "(prefers-color-scheme: dark)", media: query,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
});

const React = require("react");
const { act } = React;
const { hydrateRoot } = require("react-dom/client");
const { renderToString } = require("react-dom/server");
let AnimatedThemeToggler;
const container = document.getElementById("root");
const storageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
let root;

async function mount(saved = null, blocked = false, reduceMotion = true) {
  if (root) await act(async () => root.unmount());
  root = undefined;
  Object.defineProperty(window, "localStorage", storageDescriptor);
  localStorage.clear();
  if (saved !== null) localStorage.setItem(THEME_STORAGE_KEY, saved);
  if (blocked) Object.defineProperty(window, "localStorage", {
    configurable: true, get() { throw new Error("Storage blocked"); },
  });
  document.documentElement.dataset.theme = DEFAULT_THEME;
  document.documentElement.style.colorScheme = DEFAULT_THEME;
  window.eval(themeBootstrapScript);
  const element = React.createElement(AnimatedThemeToggler, { reduceMotion });
  container.innerHTML = renderToString(element);
  const hydrationErrors = [];
  await act(async () => {
    root = hydrateRoot(container, element, { onRecoverableError: error => hydrationErrors.push(error) });
  });
  assert.deepEqual(hydrationErrors, [], "Saved themes must not cause hydration mismatches");
  return container.querySelector("button");
}

function expectTheme(button, theme) {
  assert.equal(document.documentElement.dataset.theme, theme);
  assert.equal(document.documentElement.style.colorScheme, theme);
  assert.equal(document.querySelector('meta[name="theme-color"]').content, THEME_COLORS[theme]);
  assert.equal(button.dataset.themeState, theme);
  assert.equal(button.getAttribute("aria-label"), `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
}

(async () => {
  try {
    // Phosphor's published CJS entry is named .js inside a type:module package.
    // Load its real ESM exports for the transpiled test; Next handles this itself.
    const icons = await import("@phosphor-icons/react");
    const originalLoad = Module._load;
    Module._load = function(request, ...args) {
      return request === "@phosphor-icons/react" ? icons : originalLoad.call(this, request, ...args);
    };
    try {
      ({ AnimatedThemeToggler } = require(path.join(repository, "registry/magicui/animated-theme-toggler.tsx")));
    } finally {
      Module._load = originalLoad;
    }
    for (const [saved, blocked, expected] of [
      [null, false, "light"], ["light", false, "light"], ["dark", false, "dark"],
      ["invalid", false, "light"], [null, true, "light"],
    ]) {
      const button = await mount(saved, blocked);
      expectTheme(button, expected);
      await act(async () => button.click());
      const next = expected === "dark" ? "light" : "dark";
      expectTheme(button, next);
      assert.equal(document.documentElement.dataset.magicuiThemeVt, undefined, "Reduced motion uses no view transition");
      assert.equal(document.documentElement.dataset.magicuiThemeFallback, undefined, "Reduced motion uses no color animation");
      if (!blocked) {
        assert.equal(localStorage.getItem(THEME_STORAGE_KEY), next, "The explicit choice is persisted");
        expectTheme(await mount(next), next);
      }
    }

    // Browsers without View Transitions still switch and persist correctly.
    delete document.startViewTransition;
    let button = await mount(null, false, false);
    await act(async () => button.click());
    expectTheme(button, "dark");
    assert.equal(document.documentElement.dataset.magicuiThemeFallback, "active");

    // A rapid second tap cannot start a second capture. If reduced motion turns
    // on while the first capture waits, commit once and reject its late callbacks.
    button = await mount(null, false, false);
    const ready = deferred();
    const finished = deferred();
    let updateSnapshot;
    let starts = 0;
    let skips = 0;
    let animations = 0;
    document.startViewTransition = update => {
      starts += 1;
      updateSnapshot = update;
      return { ready: ready.promise, finished: finished.promise, skipTransition() { skips += 1; } };
    };
    document.documentElement.animate = () => { animations += 1; return { cancel() {} }; };
    await act(async () => { button.click(); button.click(); });
    assert.equal(starts, 1, "Rapid taps must share one view transition");
    await act(async () => root.render(React.createElement(AnimatedThemeToggler, { reduceMotion: true })));
    expectTheme(button, "dark");
    assert.equal(skips, 1);
    assert.equal(button.getAttribute("aria-busy"), "false");
    await act(async () => button.click());
    expectTheme(button, "light");
    await act(async () => { updateSnapshot(); ready.resolve(); finished.resolve(); });
    expectTheme(button, "light");
    assert.equal(animations, 0, "An obsolete capture must not animate after reduction");
    assert.equal(document.documentElement.dataset.magicuiThemeVt, undefined);
    assert.equal(localStorage.getItem(THEME_STORAGE_KEY), "light");

    // The normal motion path still captures the old theme, then reveals the new
    // one through Magic UI's native circular transition.
    button = await mount(null, false, false);
    const revealReady = deferred();
    const revealFinished = deferred();
    document.startViewTransition = update => {
      updateSnapshot = update;
      return { ready: revealReady.promise, finished: revealFinished.promise, skipTransition() {} };
    };
    let reveal;
    document.documentElement.animate = (frames, options) => {
      reveal = { frames, options };
      return { cancel() {} };
    };
    await act(async () => button.click());
    expectTheme(button, "light");
    await act(async () => { updateSnapshot(); revealReady.resolve(); });
    expectTheme(button, "dark");
    assert.match(reveal.frames.clipPath[0], /^circle\(0%/);
    assert.equal(reveal.options.pseudoElement, "::view-transition-new(root)");
    assert(reveal.options.duration > 0);
    await act(async () => revealFinished.resolve());
    assert.equal(button.getAttribute("aria-busy"), "false");
    assert.equal(document.documentElement.dataset.magicuiThemeVt, undefined);

    console.log("PASS: light before first paint, saved dark/light restoration, invalid/blocked storage, OS-dark independence, hydration, theme controls/browser chrome, persistence, mobile fallback, rapid taps, and reduced-motion transition cancellation.");
  } finally {
    if (root) await act(async () => root.unmount());
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

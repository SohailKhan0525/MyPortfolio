/* Runs the shipping controller with React and the pinned Lenis implementation.
 * Geometry and RAF are deterministic browser shims, not an FPS/device test.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-smooth-scroll.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Module } = require('node:module');
const base = path.resolve(__dirname, '..');
const dependency = name => require(process.env.PORTFOLIO_TEST_DEPS ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = dependency('jsdom');
const ts = dependency('typescript');
const dom = new JSDOM('<html><body><div id="root"></div><a id="work-link" href="#work">Work</a><a id="contact-link" href="#contact">Contact</a><a class="skip-link" href="#top">Skip</a><a id="route-link" href="/resume">Resume</a><a id="external-link" href="https://example.com/#work">External</a><main id="top" tabindex="-1"><section id="work"></section><section id="contact"></section><div class="terminal-history"><span id="terminal-line">Output</span></div><div class="project-explorer-list"><button id="project">Project</button></div></main></body></html>', { url: 'https://portfolio.test/', pretendToBeVisual: true });
for (const name of ['window', 'Window', 'document', 'Document', 'HTMLElement', 'HTMLAnchorElement', 'Element', 'Node', 'Event', 'EventTarget', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'WheelEvent', 'location', 'history']) global[name] = dom.window[name];
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let hidden = false;
Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
let scrollY = 0;
Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
Object.defineProperty(window, 'pageYOffset', { configurable: true, get: () => scrollY });
for (const element of [document.documentElement, document.body]) {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: 6000 });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 800 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 1280 });
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 1280 });
}
const nativeScrollCalls = [];
window.scrollTo = (options, y) => {
  scrollY = Math.max(0, Math.min(5200, typeof options === 'number' ? y : options.top ?? scrollY));
  nativeScrollCalls.push({ ...options });
  window.dispatchEvent(new Event('scroll'));
};
const positions = { top: 0, work: 1200, contact: 4200 };
for (const [id, top] of Object.entries(positions)) document.getElementById(id).getBoundingClientRect = () => ({ top: top - scrollY, bottom: top - scrollY + 400, left: 0, right: 1280, width: 1280, height: 400, x: 0, y: top - scrollY });
const fallbackCalls = [];
HTMLElement.prototype.scrollIntoView = function(options) { fallbackCalls.push({ id: this.id, options }); };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.ResizeObserver = global.ResizeObserver;
let preference = { ready: false, reduced: true };
let narrow = false;
window.matchMedia = query => ({ get matches() { return query === '(prefers-reduced-motion: reduce)' ? preference.reduced : query === '(max-width: 60rem)' && narrow; }, addEventListener() {}, removeEventListener() {} });
let clock = 1000;
let frameId = 0;
const frames = new Map();
global.performance = { now: () => clock };
global.requestAnimationFrame = window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
global.cancelAnimationFrame = window.cancelAnimationFrame = id => frames.delete(id);
const nextFrame = () => {
  clock += 16;
  const callbacks = [...frames.values()]; frames.clear();
  callbacks.forEach(callback => callback(clock));
};
const settle = () => { for (let n = 0; frames.size && n < 160; n++) nextFrame(); assert.equal(frames.size, 0, 'The frame queue must become idle'); };
require.extensions['.css'] = () => {};
const compilerOptions = { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true };
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions }).outputText, filename);
let pathname = '/';
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './MotionPreferences' && parent.filename.endsWith('SmoothScroll.tsx')) return { usePortfolioMotion: () => preference };
  if (request === 'next/navigation') return { usePathname: () => pathname };
  return originalLoad.call(this, request, parent, isMain);
};
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const SmoothScroll = require(path.join(base, 'app/SmoothScroll.tsx')).default;
const { scrollToPortfolioSection } = require(path.join(base, 'app/portfolio-scroll.ts'));
const root = createRoot(document.getElementById('root'));
const render = async () => act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(SmoothScroll))));
const wheel = (target = document.body, options = {}) => {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 200, ...options });
  target.dispatchEvent(event); return event;
};
const click = (id, options = {}) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options });
  document.getElementById(id).dispatchEvent(event); return event;
};
const near = (value, expected) => assert.ok(Math.abs(value - expected) <= 1, `${value} should be near ${expected}`);

(async () => {
  await render();
  assert.equal(document.documentElement.dataset.scrollEngine, undefined, 'No enhancement before preferences hydrate');
  assert.equal(wheel().defaultPrevented, false);
  preference = { ready: true, reduced: false }; await render();
  assert.equal(document.documentElement.dataset.scrollEngine, 'lenis');
  assert.equal(frames.size, 0, 'Mount does not begin a permanent RAF loop');
  assert.equal(wheel().defaultPrevented, true, 'Normal wheel input is smoothed');
  const startY = scrollY; nextFrame();
  assert.ok(scrollY > startY && scrollY < 180, 'Scroll has a visible intermediate position');
  settle(); near(scrollY, 180);
  clock += 10000;
  wheel(); nextFrame();
  assert.ok(scrollY > 180 && scrollY < 360, 'The first wheel after idle must not jump straight to the end');
  settle(); near(scrollY, 360);

  narrow = true;
  for (const target of ['terminal-line', 'project']) {
    assert.equal(wheel(document.getElementById(target)).defaultPrevented, false, `${target} keeps native nested scrolling`);
    settle(); near(scrollY, 360);
  }
  narrow = false;
  assert.equal(wheel(document.body, { ctrlKey: true }).defaultPrevented, false, 'Pinch/zoom is native');
  assert.equal(wheel(document.body, { shiftKey: true }).defaultPrevented, false, 'Horizontal modified wheel is native');
  const touch = new Event('touchmove', { bubbles: true, cancelable: true });
  Object.defineProperty(touch, 'targetTouches', { value: [{ clientX: 0, clientY: 30 }] });
  Object.defineProperty(touch, 'changedTouches', { value: [{ clientX: 0, clientY: 30 }] });
  document.body.dispatchEvent(touch);
  assert.equal(touch.defaultPrevented, false, 'Touch momentum is never synthesized or prevented');
  settle();

  let bubbleCalls = 0;
  const menuClose = () => bubbleCalls++;
  document.getElementById('work-link').addEventListener('click', menuClose);
  assert.equal(click('work-link').defaultPrevented, true, 'Same-page anchors have one scroll owner');
  assert.equal(bubbleCalls, 1, 'React/Next user click handlers can still close the menu');
  assert.equal(location.hash, '#work');
  nextFrame(); assert.ok(scrollY > 360 && scrollY < 1200);
  settle(); near(scrollY, 1200);
  assert.equal(document.activeElement.id, 'work', 'Focus follows the finished navigation');
  assert.equal(document.getElementById('work').getAttribute('tabindex'), '-1');
  document.getElementById('contact-link').focus();
  assert.equal(document.getElementById('work').hasAttribute('tabindex'), false, 'Temporary focusability is cleaned up');

  click('contact-link'); nextFrame();
  const key = new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true });
  document.body.dispatchEvent(key);
  assert.equal(key.defaultPrevented, false, 'Keyboard commands remain browser-owned');
  const interrupted = scrollY; settle(); near(scrollY, interrupted);
  assert.notEqual(document.activeElement.id, 'contact', 'Interrupted navigation cannot steal focus later');
  assert.equal(click('work-link', { ctrlKey: true }).defaultPrevented, false, 'Modified links retain browser semantics');
  const skip = new MouseEvent('click', { bubbles: true, cancelable: true });
  document.querySelector('.skip-link').dispatchEvent(skip);
  assert.equal(skip.defaultPrevented, false, 'Skip navigation is immediate/native');
  // Prevent JSDOM's unsupported full navigation after confirming our capture handler leaves it alone.
  document.getElementById('route-link').addEventListener('click', e => { assert.equal(e.defaultPrevented, false); e.preventDefault(); }, { once: true });
  click('route-link');

  scrollToPortfolioSection('contact'); nextFrame();
  assert.ok(scrollY < 4200); settle(); near(scrollY, 4200);
  wheel(); nextFrame(); hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(document.documentElement.dataset.scrollEngine, undefined);
  assert.equal(document.documentElement.classList.contains('lenis'), false);
  assert.equal(frames.size, 0, 'Hiding the document cancels the owned RAF');
  hidden = false; document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(document.documentElement.dataset.scrollEngine, 'lenis');
  assert.equal(frames.size, 0, 'Showing the document does not restart an idle loop');
  wheel(); nextFrame();
  window.dispatchEvent(new Event('popstate'));
  const historyY = scrollY; settle(); near(scrollY, historyY);
  window.scrollTo({ top: 800 });
  wheel(); settle(); near(scrollY, 980);

  preference = { ready: true, reduced: true }; await render();
  assert.equal(document.documentElement.classList.contains('lenis'), false, 'Live reduced motion destroys smoothing');
  assert.equal(wheel().defaultPrevented, false);
  scrollToPortfolioSection('work');
  assert.deepEqual(fallbackCalls.at(-1), { id: 'work', options: { behavior: 'auto', block: 'start' } });
  preference = { ready: true, reduced: false }; await render();
  assert.equal(wheel().defaultPrevented, true, 'Motion can be re-enabled without reloading'); settle();
  pathname = '/resume'; await render();
  assert.equal(document.documentElement.dataset.scrollEngine, 'lenis', 'Route changes replace the controller cleanly');
  assert.equal(frames.size, 0);
  await act(async () => root.unmount());
  assert.equal(document.documentElement.classList.contains('lenis'), false);
  assert.equal(wheel().defaultPrevented, false, 'Unmount leaves no wheel interception');
  assert.equal(frames.size, 0, 'Unmount leaves no owned animation loop');
  const strictRoot = createRoot(document.getElementById('root'));
  window.scrollTo({ top: 800 });
  await act(async () => strictRoot.render(React.createElement(React.StrictMode, null, React.createElement(SmoothScroll))));
  wheel(); settle(); near(scrollY, 980);
  await act(async () => strictRoot.unmount());
  assert.equal(wheel().defaultPrevented, false, 'StrictMode setup/cleanup replay leaves no duplicate listeners');
  assert.equal(frames.size, 0);
  assert.ok(nativeScrollCalls.every(call => call.behavior === 'instant' || call.top === 800), 'Lenis updates native scroll directly, without CSS double easing');
  console.log('PASS: pinned Lenis wheel easing/intermediate frames, idle RAF shutdown/restart, native touch/keyboard/nested scrolling, anchor history/focus and click propagation, interruption, programmatic fallback, hidden tabs, live reduced motion, StrictMode and route/unmount cleanup. Browser/device feel remains a separate check.');
  dom.window.close();
})().catch(error => { console.error(error); process.exitCode = 1; dom.window.close(); });

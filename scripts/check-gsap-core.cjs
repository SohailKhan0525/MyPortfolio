/* Shipping GSAP components in a controlled DOM. Native geometry/scroll are simulated;
 * GSAP, ScrollTrigger, SplitText, ScrollToPlugin, React and cleanup run unchanged.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-gsap-core.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire, Module } = require('node:module');
const base = path.resolve(__dirname, '..');
const req = createRequire(path.join(base, 'package.json'));
const dependency = name => require(process.env.PORTFOLIO_TEST_DEPS ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = dependency('jsdom');
const ts = dependency('typescript');
const dom = new JSDOM('<html><body><header class="site-header"></header><div id="root"></div><section id="work" data-top="2800"></section><section id="contact" data-top="4200"></section><a id="jump" href="#work">Work</a><a id="skip" class="skip-link" href="#contact">Skip</a><div id="native" data-scroll-native><span>Native child</span></div><div id="nested" style="overflow-y:auto"><span>Scrollable child</span></div><input id="input"><button id="outside">Outside</button></body></html>', { url: 'https://portfolio.test/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'EventTarget', 'CustomEvent', 'KeyboardEvent', 'WheelEvent', 'MouseEvent', 'AbortController', 'AbortSignal', 'location', 'history']) global[name] = dom.window[name];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let scrollY = 0;
let finePointer = true;
let reduced = false;
let ready = false;
let pathname = '/';
let hidden = false;
const viewportHeight = 800;
const documentHeight = 6000;
Object.defineProperty(window, 'innerHeight', { value: viewportHeight, configurable: true });
Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
for (const key of ['scrollY', 'pageYOffset']) Object.defineProperty(window, key, { get: () => scrollY, configurable: true });
for (const key of ['scrollX', 'pageXOffset']) Object.defineProperty(window, key, { get: () => 0, configurable: true });
Object.defineProperty(document, 'hidden', { get: () => hidden, configurable: true });
for (const node of [document.documentElement, document.body]) {
  Object.defineProperty(node, 'scrollHeight', { get: () => documentHeight, configurable: true });
  Object.defineProperty(node, 'clientHeight', { get: () => viewportHeight, configurable: true });
  Object.defineProperty(node, 'clientWidth', { get: () => 1280, configurable: true });
  Object.defineProperty(node, 'scrollTop', { get: () => scrollY, set: value => { scrollY = Number(value); }, configurable: true });
}
window.scrollTo = (x, y) => {
  scrollY = Math.max(0, Math.min(documentHeight - viewportHeight, typeof x === 'object' ? (x.top ?? scrollY) : (y ?? scrollY)));
  document.dispatchEvent(new window.Event('scroll'));
  window.dispatchEvent(new window.Event('scroll'));
};
HTMLElement.prototype.scrollIntoView = function () { window.scrollTo({ top: Number(this.dataset.top || 0) }); };
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { get() { return this.style.height === '100vh' ? viewportHeight : this.classList.contains('site-header') ? 76 : 64; }, configurable: true });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { get() { return this.tagName === 'SPAN' ? Math.max(8, this.textContent.length * 9) : 640; }, configurable: true });
Object.defineProperty(HTMLElement.prototype, 'offsetTop', { get() { return 0; }, configurable: true });
HTMLElement.prototype.getBoundingClientRect = function () {
  const positioned = this.closest('[data-top]');
  const documentTop = positioned ? Number(positioned.dataset.top) : 0;
  const top = this === document.body || this === document.documentElement ? -scrollY : documentTop - scrollY;
  const width = this.offsetWidth;
  return { x: 0, y: top, top, left: 0, right: width, bottom: top + this.offsetHeight, width, height: this.offsetHeight, toJSON() { return this; } };
};
Object.defineProperty(document.getElementById('nested'), 'scrollHeight', { value: 600 });
Object.defineProperty(document.getElementById('nested'), 'clientHeight', { value: 100 });
window.matchMedia = query => ({ media: query, get matches() { return query.includes('pointer: fine') || query === '(hover: hover)' ? finePointer : query.includes('prefers-reduced-motion') ? reduced : false; }, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
const resizeObservers = [];
global.ResizeObserver = window.ResizeObserver = class {
  constructor(callback) { this.callback = callback; this.disconnected = false; resizeObservers.push(this); }
  observe() {} unobserve() {} disconnect() { this.disconnected = true; }
};
Object.defineProperty(document, 'fonts', { value: { status: 'loaded', ready: Promise.resolve(), addEventListener() {}, removeEventListener() {} }, configurable: true });
require.extensions['.css'] = () => {};
const compile = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
require.extensions['.tsx'] = compile; require.extensions['.ts'] = compile;
const React = req('react');
const { act } = React;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'next/navigation') return { usePathname: () => pathname };
  if (request === './MotionPreferences') return { usePortfolioMotion: () => ({ reduced, ready }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { gsap, ScrollTrigger } = req(path.join(base, 'app/gsap.ts'));
const SmoothScroll = req(path.join(base, 'app/SmoothScroll.tsx')).default;
const { AnimatedHeading, SectionTitle, Reveal, MotionButton, AnimatedMetric } = req(path.join(base, 'app/MotionElements.tsx'));
const { scrollToPortfolioSection } = req(path.join(base, 'app/portfolio-scroll.ts'));
const { createRoot } = req('react-dom/client');
const { renderToStaticMarkup } = req('react-dom/server');
let root = createRoot(document.getElementById('root'));
let showElements = false;
const element = React.createElement;
const Samples = () => element(React.Fragment, null,
  element('div', { 'data-top': 100 }, element(AnimatedHeading, null, 'Python, models and working apps.')),
  element('div', { 'data-top': 1500 }, element(SectionTitle, null, 'Selected projects')),
  element('div', { 'data-top': 2000 }, element(Reveal, { className: 'test-reveal', sequence: true }, element('p', null, 'First project'), element('p', null, 'Second project'))),
  element('div', { 'data-top': 2100 }, element(AnimatedMetric, { value: 273 })),
  element(MotionButton, { id: 'motion-button' }, 'Open project', element('svg', null)),
);
const render = () => root.render(element(React.StrictMode, null, element(SmoothScroll), showElements && element(Samples)));
const settle = ms => act(async () => new Promise(resolve => setTimeout(resolve, ms)));
const dispatch = (node, event) => act(async () => node.dispatchEvent(event));
const wheel = async (node = document.body, options = {}) => {
  const event = new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true, ...options });
  await dispatch(node, event);
  return event;
};
const jumpTo = async value => { window.scrollTo(0, value); ScrollTrigger.update(); await settle(25); };
const close = (actual, expected, message) => assert(Math.abs(actual - expected) < 2, `${message}: got ${actual}, expected ${expected}`);

(async () => {
  try {
    const html = renderToStaticMarkup(element(Samples));
    assert(html.includes('Python, models and working apps.') && html.includes('Selected projects') && html.includes('First project'));
    assert(!html.includes('opacity:0'), 'Server output does not hide primary content');
    await act(async () => render());
    assert.equal(document.documentElement.dataset.scrollEngine, undefined, 'Not-ready hydration keeps native scrolling');
    assert.equal((await wheel()).defaultPrevented, false);
    ready = true;
    await act(async () => render());
    assert.equal(document.documentElement.dataset.scrollEngine, 'gsap');

    await jumpTo(0);
    assert.equal((await wheel()).defaultPrevented, true, 'Fine-pointer vertical wheel uses GSAP');
    await settle(90);
    assert(scrollY > 0 && scrollY < 190, `Wheel reaches an intermediate native scroll position: ${scrollY}`);
    await settle(700);
    close(scrollY, 190, 'Wheel settles to its bounded target');
    await jumpTo(0);
    await act(async () => {
      document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
      document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
    });
    await settle(750);
    close(scrollY, 190, 'Same-frame wheel events preserve both deltas');

    for (const node of [document.getElementById('native'), document.querySelector('#native span'), document.getElementById('nested'), document.querySelector('#nested span'), document.getElementById('input')]) {
      assert.equal((await wheel(node)).defaultPrevented, false, `Nested/native region remains native: ${node.id || node.parentElement.id}`);
    }
    for (const options of [{ deltaX: 300 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) assert.equal((await wheel(document.body, options)).defaultPrevented, false);
    finePointer = false;
    assert.equal((await wheel()).defaultPrevented, false, 'Coarse-pointer device retains native wheel behavior');
    finePointer = true;
    const touch = new window.Event('touchstart', { bubbles: true, cancelable: true });
    await dispatch(document.body, touch);
    assert.equal(touch.defaultPrevented, false, 'Touch is never prevented');

    for (const event of [new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }), new window.Event('pointerdown', { bubbles: true }), new window.Event('touchstart', { bubbles: true })]) {
      await wheel(); await settle(60);
      await dispatch(document.body, event);
      const stopped = scrollY;
      await settle(120);
      close(scrollY, stopped, `${event.type} cancels momentum`);
    }
    await wheel(); await settle(50);
    await dispatch(window, new CustomEvent('portfolio:menu-state', { detail: { open: true } }));
    const menuPosition = scrollY;
    assert.equal((await wheel()).defaultPrevented, false, 'Open curtain releases wheel events');
    await settle(100); close(scrollY, menuPosition, 'Opening the menu stops ongoing momentum');
    await dispatch(window, new CustomEvent('portfolio:menu-state', { detail: { open: false } }));

    await jumpTo(0);
    const anchorEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    await dispatch(document.getElementById('jump'), anchorEvent);
    assert(anchorEvent.defaultPrevented, 'Same-page anchor uses the coordinated scroller');
    assert.equal(location.hash, '#work', 'Anchor updates the real URL');
    await settle(1050);
    close(scrollY, 2700, 'Anchor honors header height plus breathing room');
    assert.equal(document.activeElement, document.getElementById('work'), 'Completed anchor moves keyboard focus');
    assert.equal(document.getElementById('work').getAttribute('tabindex'), '-1');
    document.getElementById('outside').focus();
    assert.equal(document.getElementById('work').hasAttribute('tabindex'), false, 'Temporary target tabindex clears on blur');
    const skip = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    document.getElementById('skip').addEventListener('click', event => event.preventDefault(), { once: true });
    await dispatch(document.getElementById('skip'), skip);
    assert.equal(gsap.getTweensOf(window).length, 0, 'Skip link does not create a delayed scroll tween');
    scrollToPortfolioSection('contact');
    await settle(1050);
    close(scrollY, 4100, 'Terminal/programmatic navigation uses the same native-window bridge');
    assert.equal(document.activeElement, document.getElementById('contact'));
    document.getElementById('outside').focus();
    scrollToPortfolioSection('work');
    await settle(80);
    window.scrollTo(0, 600);
    await settle(150);
    close(scrollY, 600, 'An independent native scroll auto-kills anchor easing');
    assert.equal(document.activeElement, document.getElementById('outside'), 'Interrupted navigation does not steal focus later');
    await wheel(document.body, { deltaY: 100 });
    await settle(750);
    close(scrollY, 695, 'Wheel after native cancellation starts from the current position');

    await wheel(); await settle(50);
    const beforeReduction = scrollY;
    reduced = true; await act(async () => render());
    close(scrollY, beforeReduction, 'Reduced motion cancels without reverting the page position');
    assert.equal(document.documentElement.dataset.scrollEngine, undefined);
    assert.equal((await wheel()).defaultPrevented, false);
    assert.equal(document.getElementById('contact').hasAttribute('tabindex'), false, 'Disabling easing releases temporary focus attributes');
    reduced = false; await act(async () => render());

    await jumpTo(0);
    showElements = true; await act(async () => render());
    ScrollTrigger.refresh(); ScrollTrigger.update();
    await settle(90);
    const heroLine = document.querySelector('h1 .editorial-line');
    assert(heroLine, 'Actual SplitText creates a line mask');
    const heroY = Number(gsap.getProperty(heroLine, 'yPercent'));
    assert(heroY > 0 && heroY < 18, `Hero reveals through a genuine intermediate transform: ${heroY}`);
    assert.equal(document.querySelector('.test-reveal p').style.opacity, '', 'Offscreen reveal remains readable before its trigger');
    await jumpTo(900);
    await settle(100);
    const sectionLine = document.querySelector('h2 .editorial-line');
    const sectionY = Number(gsap.getProperty(sectionLine, 'yPercent'));
    assert(sectionY > 0 && sectionY < 102, `Section headline visibly moves through its mask: ${sectionY}`);
    await jumpTo(1400);
    await settle(90);
    const reveal = document.querySelector('.test-reveal p');
    const revealY = Number(gsap.getProperty(reveal, 'y'));
    assert(revealY > 0 && revealY < 32, `Reveal progresses through a real intermediate transform: ${revealY}`);
    assert(Number(reveal.style.opacity) > .5 && Number(reveal.style.opacity) < 1);
    const button = document.getElementById('motion-button');
    await dispatch(button, new window.Event('pointerenter'));
    await settle(100);
    assert(Number(gsap.getProperty(button, 'y')) < 0, 'GSAP control hover responds visibly');
    await dispatch(button, new window.Event('pointerdown', { bubbles: true }));
    await settle(100);
    assert(Number(gsap.getProperty(button, 'scaleX')) < 1, 'GSAP control press responds visibly');
    await dispatch(button, new window.Event('pointercancel'));
    await settle(300);
    assert(Math.abs(Number(gsap.getProperty(button, 'scaleX')) - 1) < .001, 'Pointer cancellation releases press');
    reduced = true; await act(async () => render());
    assert.equal(document.querySelector('h1 .editorial-line'), null, 'Reduced motion reverts SplitText markup');
    assert.equal(document.querySelector('h1').textContent, 'Python, models and working apps.');
    assert.equal(document.querySelector('.test-reveal p').style.transform, '', 'Reduced motion removes reveal transforms');
    assert.equal(document.querySelector('.test-reveal p').style.opacity, '', 'Reduced motion restores normal opacity');
    assert.equal(document.querySelector('.metric-accessible').textContent, '273');
    assert.equal(document.querySelector('.metric-accessible + span').textContent, '273', 'Interrupted counters settle at their real value');
    assert.equal(ScrollTrigger.getAll().length, 0, 'Reduction cleans up owned ScrollTriggers');
    await act(async () => root.unmount());
    assert.equal(gsap.getTweensOf(window).length, 0);
    assert.equal(document.documentElement.dataset.scrollEngine, undefined);
    assert.equal((await wheel()).defaultPrevented, false, 'Unmount removes wheel interception');
    assert(resizeObservers.every(observer => observer.disconnected), 'SplitText resize observers clean up');
    console.log('PASS: real GSAP/SplitText/ScrollTrigger intermediate animation, SSR and ready-state readability, reduced-motion cleanup, native-window wheel easing, burst input, nested/touch/modifier exemptions, interruption, menu lock, anchor URL/focus, bridge navigation and StrictMode cleanup.');
  } finally {
    await act(async () => root.unmount());
    ScrollTrigger.killAll(); ScrollTrigger.disable(); gsap.globalTimeline.clear(); gsap.ticker.sleep(); Module._load = originalLoad; dom.window.close();
  }
})().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });

/* Shipping header + real React/Motion. Routing, icons and theme are isolated;
 * viewport geometry/native keyboard navigation remain browser checks.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-navigation-motion.cjs
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
const dom = new JSDOM('<html><body><div id="root"></div><main><section id="work"></section><section id="about"></section></main><button id="outside">Outside</button></body></html>', { url: 'https://portfolio.test', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'EventTarget', 'CustomEvent', 'KeyboardEvent', 'AbortController', 'AbortSignal']) global[name] = dom.window[name];
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let reduced = false;
let compact = true;
const mediaListeners = new Set();
window.matchMedia = query => ({
  get matches() { return query === '(max-width: 64rem)' ? compact : false; },
  addEventListener(_, listener) { if (query === '(max-width: 64rem)') mediaListeners.add(listener); },
  removeEventListener(_, listener) { mediaListeners.delete(listener); },
  addListener() {}, removeListener() {},
});
const observers = [];
global.IntersectionObserver = window.IntersectionObserver = class {
  constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
  observe() {}
  unobserve() {}
  disconnect() { this.disconnected = true; }
};
const outsideListeners = new Set();
const add = document.addEventListener.bind(document);
const remove = document.removeEventListener.bind(document);
document.addEventListener = (name, listener, options) => { if (name === 'pointerdown') outsideListeners.add(listener); return add(name, listener, options); };
document.removeEventListener = (name, listener, options) => { if (name === 'pointerdown') outsideListeners.delete(listener); return remove(name, listener, options); };
require.extensions['.css'] = () => {};
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const React = req('react');
const { act } = React;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'next/link') return { __esModule: true, default: React.forwardRef(({ children, ...props }, ref) => React.createElement('a', { ...props, ref, onClick(event) { props.onClick?.(event); event.preventDefault(); } }, children)) };
  if (request === './MotionPreferences') return { usePortfolioMotion: () => ({ reduced, ready: true }) };
  if (request === './BrandMark') return { __esModule: true, default: () => React.createElement('span', null, 'Logo') };
  if (request === './ThemeToggle') return { __esModule: true, default: () => React.createElement('button', { type: 'button', className: 'test-theme' }, 'Theme') };
  if (request === '@phosphor-icons/react') return { List: () => null, X: () => null };
  return originalLoad.call(this, request, parent, isMain);
};
const Header = req(path.join(base, 'app/PortfolioHeader.tsx')).default;
const { renderToStaticMarkup } = req('react-dom/server');
const { createRoot } = req('react-dom/client');
const root = createRoot(document.getElementById('root'));
const render = () => root.render(React.createElement(React.StrictMode, null, React.createElement(Header)));
const button = () => document.querySelector('.mobile-menu-button');
const nav = () => document.getElementById('primary-navigation');
const click = element => act(async () => element.click());
const settle = (ms = 450) => act(async () => new Promise(resolve => setTimeout(resolve, ms)));
const resize = async value => { compact = value; await act(async () => { for (const listener of mediaListeners) listener({ matches: compact }); }); };

(async () => {
  try {
    const html = renderToStaticMarkup(React.createElement(Header));
    assert.equal((html.match(/class="nav-link"/g) || []).length, 7, 'All navigation destinations exist in SSR');
    assert(!html.includes('mobile-visible'), 'SSR does not flash an open mobile menu');
    await act(async () => render());
    await settle(50);
    assert.equal(nav(), null, 'Compact header starts closed after hydration');
    assert.equal(button().getAttribute('aria-expanded'), 'false');
    assert.equal(mediaListeners.size, 1, 'StrictMode keeps one media listener');

    await click(button());
    assert.equal(button().getAttribute('aria-expanded'), 'true');
    assert.equal(nav().querySelectorAll('a').length, 7);
    assert.equal(document.activeElement, nav().querySelector('a'), 'Opening the menu gives keyboard users its first link');
    await settle(70);
    assert(Number(nav().style.opacity) > 0 && Number(nav().style.opacity) < 1, 'The actual surface has an intermediate opening state');
    await settle();
    assert.equal(nav().style.opacity, '1');
    assert.equal(nav().style.transform, 'none');
    assert([...nav().querySelectorAll('.navigation-item')].every(item => item.style.opacity === '1'), 'Staggered links all settle visibly');
    await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(button().getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, button(), 'Escape restores focus to the menu trigger');
    assert(nav().hasAttribute('inert'), 'Exiting links become inert immediately');
    assert.equal(nav().getAttribute('aria-hidden'), 'true', 'The closing menu leaves the accessibility tree immediately');
    await settle(260);
    assert.equal(nav(), null, 'The closing surface is removed after its short exit');

    await click(button());
    await click(nav().querySelector('a[href="#work"]'));
    assert.equal(button().getAttribute('aria-expanded'), 'false', 'Selecting a destination closes the menu');
    assert.equal(document.activeElement, button(), 'Focused destination never remains inside an inert exiting menu');
    await settle(260);
    await click(button());
    await act(async () => document.getElementById('outside').dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true })));
    assert.equal(button().getAttribute('aria-expanded'), 'false', 'Clicking outside closes the bounded menu');
    await settle(260);
    await click(button());
    await act(async () => document.getElementById('outside').focus());
    assert.equal(button().getAttribute('aria-expanded'), 'false', 'Tabbing beyond the menu closes it');
    assert.equal(document.activeElement.id, 'outside', 'Tab-out preserves the new focus destination');
    await settle(260);

    await click(button());
    await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await click(button());
    await settle();
    assert.equal(document.querySelectorAll('#primary-navigation').length, 1, 'Rapid close/reopen never duplicates IDs');
    assert.equal(nav().hasAttribute('inert'), false);
    assert.equal(nav().style.opacity, '1');
    await resize(false);
    await settle(60);
    assert.equal(nav().dataset.menuSurface, 'desktop');
    assert.equal(nav().style.opacity, '1');
    assert.equal(nav().style.transform, 'none');
    assert.equal(button().getAttribute('aria-expanded'), 'false');
    assert.equal(document.querySelectorAll('#primary-navigation').length, 1, 'Desktop resize retains a single navigation tree');
    await act(async () => observers.findLast(observer => !observer.disconnected).callback([{ isIntersecting: true, target: document.getElementById('work') }]));
    assert.equal(nav().querySelector('a[href="#work"]').getAttribute('aria-current'), 'location', 'Section tracking survives menu choreography');
    await resize(true);
    await settle(60);
    assert.equal(nav(), null, 'Returning to compact width starts closed');

    reduced = true;
    await act(async () => render());
    await click(button());
    assert.equal(nav().style.opacity, '1', 'Reduced motion opens at its final readable state');
    assert.equal(nav().style.transform, 'none');
    assert([...nav().querySelectorAll('.navigation-item')].every(item => item.style.opacity === '1'));
    await act(async () => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await settle(35);
    assert.equal(nav(), null, 'Reduced motion has no delayed menu exit');
    await click(button());
    await act(async () => root.unmount());
    assert.equal(outsideListeners.size, 0, 'Unmount removes the outside-click listener');
    assert.equal(mediaListeners.size, 0, 'Unmount removes responsive listeners');
    assert(observers.every(observer => observer.disconnected), 'Unmount disconnects section observers');
    console.log('PASS: SSR navigation, compact startup, actual panel/link choreography, Escape/focus restoration, inert exit, destination/outside/Tab-out closing, rapid reopen, desktop resize, active section, reduced motion and StrictMode cleanup.');
  } finally {
    await act(async () => root.unmount());
    Module._load = originalLoad;
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

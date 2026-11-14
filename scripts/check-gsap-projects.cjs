/* Actual React, Radix, GSAP and Flip runtime. Layout fits use explicit fixture geometry;
 * real browser geometry remains a separate check. No animation-library mocks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire, Module } = require('node:module');
const base = path.resolve(__dirname, '..');
const req = createRequire(path.join(base, 'package.json'));
const dependency = name => require(process.env.PORTFOLIO_TEST_DEPS ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = dependency('jsdom');
const ts = dependency('typescript');
const dom = new JSDOM('<html><body><header class="site-header"></header><div id="work-root"></div><div id="ai-root"></div></body></html>', { url: 'https://portfolio.test', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'EventTarget', 'CustomEvent', 'KeyboardEvent', 'AbortController', 'AbortSignal']) global[name] = dom.window[name];
global.SVGPathElement = dom.window.SVGElement;
SVGElement.prototype.getTotalLength = () => 300;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let reduced = true;
let pageScrolls = 0;
window.scrollTo = () => { pageScrolls++; };
HTMLElement.prototype.scrollIntoView = () => { pageScrolls++; };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
const observers = new Set();
global.ResizeObserver = window.ResizeObserver = class {
  constructor(callback) { this.callback = callback; this.targets = new Set(); observers.add(this); }
  observe(target) { this.targets.add(target); }
  disconnect() { observers.delete(this); }
};
let headingHeight = 130;
let bodyHeight = 350;
Object.defineProperty(window, 'innerHeight', { writable: true, value: 900 });
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() {
  if (this.classList.contains('ai-record-heading')) return headingHeight;
  if (this.classList.contains('site-header')) return 72;
  if (this.classList.contains('ai-card-body-inner')) return bodyHeight;
  if (this.classList.contains('project-explorer-choice')) return this.hidden ? 0 : 83;
  return parseFloat(this.style.height) || 0;
}});
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() {
  return this.classList.contains('ai-card-body-inner') ? bodyHeight : this.offsetHeight;
}});
HTMLElement.prototype.getBoundingClientRect = function () {
  let top = 100;
  let width = 500;
  let height = this.offsetHeight;
  if (this.classList.contains('site-header')) top = 0;
  if (this.classList.contains('project-explorer-choice')) {
    top = [...this.parentElement.children].filter(node => !node.hidden).indexOf(this) * 83;
    width = this.hidden ? 0 : 300;
  }
  return { x: 0, y: top, top, left: 0, right: width, bottom: top + height, width, height, toJSON() {} };
};
require.extensions['.css'] = () => {};
const compile = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
require.extensions['.tsx'] = compile;
require.extensions['.ts'] = compile;
const React = req('react');
const { act } = React;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './ProjectIllustration') return { __esModule: true, default: ({ index }) => React.createElement('svg', { 'data-study-index': index }) };
  if (request === './MotionPreferences') return { usePortfolioMotion: () => ({ reduced, ready: true }) };
  if (request === '@phosphor-icons/react') return { ArrowLeft: () => null, ArrowRight: () => null, ArrowUpRight: () => null, GithubLogo: () => null, CaretDown: () => null };
  return originalLoad.call(this, request, parent, isMain);
};
const ProjectExplorer = req(path.join(base, 'app/ProjectExplorer.tsx')).default;
const ProjectDisclosures = req(path.join(base, 'app/ProjectDisclosures.tsx')).default;
const { gsap, ScrollTrigger } = req(path.join(base, 'app/gsap.ts'));
const { createRoot } = req('react-dom/client');
const { renderToString } = req('react-dom/server');
const data = {};
const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(base, 'app/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['projects', 'aiEra'].includes(node.name.getText(source))) {
    const result = { exports: {} };
    new Function('module', ts.transpileModule(`module.exports = ${node.initializer.getText(source)}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText)(result);
    data[node.name.getText(source)] = result.exports;
  }
  ts.forEachChild(node, visit);
}
visit(source);
const workRoot = createRoot(document.getElementById('work-root'));
const aiRoot = createRoot(document.getElementById('ai-root'));
let launchRequest = null;
const render = () => {
  workRoot.render(React.createElement(React.StrictMode, null, React.createElement(ProjectExplorer, { projects: data.projects, launchRequest })));
  aiRoot.render(React.createElement(React.StrictMode, null, React.createElement(ProjectDisclosures, { items: data.aiEra })));
};
const click = element => act(async () => { assert(element); element.click(); });
const settle = ms => act(async () => new Promise(resolve => setTimeout(resolve, ms)));
const choices = () => [...document.querySelectorAll('.project-explorer-choice:not([hidden]) button')];
const choice = name => choices().find(button => button.textContent.includes(name));
const filter = label => [...document.querySelectorAll('.project-explorer-filter')].find(button => button.textContent.startsWith(label));
const title = () => document.getElementById('selected-project-title');
const stack = () => document.querySelector('.ai-project-stack');
const resize = async (width, height) => { window.innerWidth = width; window.innerHeight = height; await act(async () => window.dispatchEvent(new dom.window.Event('resize'))); await settle(80); };

(async () => {
  try {
    const html = renderToString(React.createElement(ProjectExplorer, { projects: data.projects }));
    assert(html.includes(data.projects[0][1]) && html.includes(data.projects[0][5]), 'SSR preserves initial study and destination');
    assert(!html.includes('opacity:0;'), 'Primary content is available before GSAP');
    await act(async () => render());
    await settle(50);
    assert.equal(data.projects.length, 7);
    assert.equal(choices().length, 7);
    assert.equal(stack().dataset.stickyMode, 'flow', 'Reduced motion presents a linear project story');
    assert.equal(document.querySelectorAll('.ai-card[data-state="open"]').length, 3, 'AI chapters start readable');
    for (const project of data.projects) {
      const button = choice(project[1]);
      button.focus();
      await click(button);
      assert.equal(document.activeElement, button, 'Selecting a study preserves focus');
      assert.equal(title().textContent, project[1]);
      assert.equal(document.querySelector('.project-explorer-description').textContent, project[3]);
      assert.deepEqual([...document.querySelectorAll('[aria-label="Technologies"] li')].map(node => node.textContent), project[4]);
      assert.equal(document.querySelector('.project-explorer-link-primary').getAttribute('href'), project[5]);
      assert.equal(document.querySelector('.project-explorer-link-source').getAttribute('href'), project[6]);
      assert.equal(document.querySelector('[data-study-index]').dataset.studyIndex, String(Number(project[0]) - 1));
    }
    await click(filter('Python apps'));
    assert.equal(choices().length, 3);
    assert.equal(title().textContent, 'File Handling');
    await click(filter('Machine learning'));
    assert.equal(choices().length, 4);
    assert.equal(title().textContent, 'House Price Prediction');
    await click(document.querySelector('[aria-label="Next project"]'));
    assert.equal(title().textContent, 'Global Earthquake Prediction');
    await click(document.querySelector('[aria-label="Previous project"]'));
    assert.equal(title().textContent, 'House Price Prediction');
    assert.equal(document.querySelector('[aria-label="Previous project"]').disabled, true);
    assert.equal(pageScrolls, 0, 'Project interactions never scroll the whole page');

    const rail = document.getElementById('project-options');
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 350 },
      scrollWidth: { configurable: true, value: 1568 },
    });
    const heartButton = choice('Heart Disease Prediction');
    rail.getBoundingClientRect = () => ({ left: 0, right: 350 });
    heartButton.getBoundingClientRect = () => ({ left: 448 - rail.scrollLeft, right: 672 - rail.scrollLeft });
    launchRequest = { id: '03', serial: 1 };
    await act(async () => render());
    assert.equal(title().textContent, 'Heart Disease Prediction');
    assert.equal(filter('Machine learning').getAttribute('aria-pressed'), 'true', 'A compatible filter survives a visit from the world');
    assert.equal(rail.scrollLeft, 448, 'The chosen station reveals its offscreen project option in the narrow rail');
    assert.equal(document.querySelector('.project-explorer-link-primary').getAttribute('href'), data.projects[2][5]);
    await click(filter('Python apps'));
    await act(async () => render());
    assert.equal(title().textContent, 'Student Management', 'A consumed request does not override browsing');
    launchRequest = { id: '03', serial: 2 };
    await act(async () => render());
    assert.equal(title().textContent, 'Heart Disease Prediction', 'Revisiting the same station selects it again');
    assert.equal(filter('All work').getAttribute('aria-pressed'), 'true', 'An incompatible filter clears');
    assert.equal(document.getElementById('project-detail').tabIndex, -1, 'The destination can receive focus without another tab stop');
    assert.equal(pageScrolls, 0, 'Rail positioning leaves the document scroll to the page navigation');
    delete heartButton.getBoundingClientRect;
    delete rail.getBoundingClientRect;
    delete rail.clientWidth;
    delete rail.scrollWidth;

    const triggers = [...document.querySelectorAll('.ai-card-head')];
    await click(triggers[0]);
    const firstBody = document.querySelector('#ai-body-loopproof');
    assert(firstBody.hasAttribute('inert') && firstBody.getAttribute('aria-hidden') === 'true', 'Closed content is removed from keyboard and assistive navigation');
    assert.equal(firstBody.style.height, '0px');
    await click(triggers[0]);
    assert.equal(firstBody.style.height, 'auto');
    await act(async () => { triggers[0].focus(); triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
    assert.equal(document.activeElement, triggers[1], 'Radix keyboard navigation remains functional');
    data.aiEra.forEach(item => { assert(stack().textContent.includes(item.blurb)); assert(stack().textContent.includes(item.why)); });
    for (const observer of observers) for (const node of observer.targets) assert(!node.classList.contains('ai-card-body'), 'Never observe animated height');

    reduced = false;
    await act(async () => render());
    await settle(70);
    assert.equal(stack().dataset.stickyMode, 'cards', 'Full desktop cards pin when all intrinsic content fits');
    await click(triggers[0]);
    assert(firstBody.hasAttribute('inert'), 'Animated close removes interaction immediately');
    await settle(100);
    assert(Number(firstBody.style.opacity) > 0 && Number(firstBody.style.opacity) < 1, 'GSAP produces a real intermediate disclosure fade');
    await click(triggers[0]);
    await settle(700);
    assert.equal(firstBody.style.height, 'auto', 'A rapid reopen settles at intrinsic height');
    assert.equal(firstBody.style.opacity, '1');
    assert.equal(firstBody.hasAttribute('inert'), false);
    await resize(390, 844);
    assert.equal(stack().dataset.stickyMode, 'cards', 'The same fit rule enables mobile cards');
    bodyHeight = 620;
    await resize(390, 667);
    assert.equal(stack().dataset.stickyMode, 'headings', 'Long phone chapters retain native scrolling below their pinned heading');
    await resize(390, 220);
    assert.equal(stack().dataset.stickyMode, 'flow', 'Very short screens never trap content under sticky headings');
    await resize(1280, 900);
    await click(filter('All work'));
    await click(choice('Bank Management'));
    await settle(100);
    assert.notEqual(title().style.transform, '', 'The shipping GSAP title has an intermediate transform');
    assert.equal(document.querySelector('.project-explorer-link-primary').getAttribute('href'), data.projects[5][5], 'Targets update before visual transition completes');
    await click(filter('Machine learning'));
    await click(filter('Python apps'));
    assert.equal(choices().length, 3);
    assert.equal(document.querySelectorAll('#selected-project-title').length, 1);
    reduced = true;
    await act(async () => render());
    await settle(60);
    assert.equal(title().style.transform, '', 'Live reduced motion reverts the in-flight GSAP context');
    assert.equal(title().style.opacity, '');
    assert.equal(stack().dataset.stickyMode, 'flow');
    await settle(650);
    assert.equal(title().style.transform, '', 'Canceled staggering does not restart');
    await act(async () => { workRoot.unmount(); aiRoot.unmount(); });
    assert.equal(observers.size, 0, 'StrictMode and unmount release all intrinsic-size observers');
    assert.equal(ScrollTrigger.getAll().length, 0, 'Component scopes release all ScrollTriggers');
    console.log('PASS: all 7 studies/URLs, repeat world visits, filter and rail handoff, 3 AI chapters/copy, filtering, Prev/Next, focus, accordion semantics, desktop/mobile/short viewport fit modes, genuine GSAP intermediate state, rapid selection, live reduced motion and StrictMode cleanup.');
  } finally {
    await act(async () => { workRoot.unmount(); aiRoot.unmount(); });
    ScrollTrigger.killAll(); ScrollTrigger.disable(); gsap.globalTimeline.clear(); gsap.ticker.sleep();
    Module._load = originalLoad; dom.window.close();
  }
})().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });

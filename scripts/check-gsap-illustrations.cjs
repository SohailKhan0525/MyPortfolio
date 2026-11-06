/* React/GSAP lifecycle verification with controlled visibility and SVG geometry.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-gsap-illustrations.cjs
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
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'https://portfolio.test', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'SVGSVGElement', 'Element', 'Node', 'NodeList']) global[name] = dom.window[name];
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 600, height: 220 });
SVGElement.prototype.getCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
SVGElement.prototype.getTotalLength = () => 200;
let visible = true;
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visible ? 'visible' : 'hidden' });
const observations = new Set();
class Observer {
  constructor(callback) { this.callback = callback; this.targets = new Set(); observations.add(this); }
  observe(target) { this.targets.add(target); }
  disconnect() { this.targets.clear(); observations.delete(this); }
}
global.IntersectionObserver = window.IntersectionObserver = Observer;
const intersect = (target, isIntersecting) => {
  for (const observer of observations) if (observer.targets.has(target)) observer.callback([{ target, isIntersecting }]);
};
require.extensions['.css'] = () => {};
for (const extension of ['.tsx', '.ts']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const React = req('react');
const { act } = React;
const { gsap } = req('gsap');
const { useGSAP } = req('@gsap/react');
gsap.registerPlugin(useGSAP);
let reduced = false;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './gsap') return { gsap, useGSAP };
  if (request === './MotionPreferences') return { usePortfolioMotion: () => ({ ready: true, reduced }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { createRoot } = req('react-dom/client');
const { renderToString } = req('react-dom/server');
const DataInstrument = req(path.join(base, 'app/DataInstrument.tsx')).default;
const ProjectIllustration = req(path.join(base, 'app/ProjectIllustration.tsx')).default;
const root = createRoot(document.getElementById('root'));
const children = index => React.createElement(React.Fragment, null,
  React.createElement(DataInstrument), React.createElement(ProjectIllustration, { index }));
const timelines = () => gsap.globalTimeline.getChildren(false, false, true);
const settle = async fn => { await act(async () => { fn(); }); gsap.ticker.sleep(); };

(async () => {
  try {
    for (let index = 0; index < 7; index++) {
      const html = renderToString(React.createElement(ProjectIllustration, { index }));
      assert(html.includes('role="img"') && html.includes('aria-label='), 'Every study has a textual alternative');
      assert(html.includes('data-draw-path'), 'Every project retains its original illustrative data path');
      assert(!html.includes('visibility:hidden'), 'The complete drawing is available before hydration');
    }
    await settle(() => root.render(children(0)));
    assert.equal(timelines().length, 2, 'One context-owned timeline per drawing');
    assert(timelines().every(t => t.paused()), 'Offscreen diagrams do not run');
    const originalSvg = document.querySelector('.project-drawing');
    await settle(() => {
      intersect(document.querySelector('.data-instrument'), true);
      intersect(originalSvg, true);
    });
    assert(timelines().every(t => !t.paused()), 'Visible drawings begin without hover or pointer input');
    timelines().forEach(t => t.totalTime(1.8));
    assert.equal(document.querySelector('.project-drawing'), originalSvg, 'A scene is not remounted during playback');
    assert(document.querySelector('[data-draw-path]').style.strokeDasharray, 'The actual GSAP DrawSVG plugin controls the path');

    await settle(() => { visible = false; document.dispatchEvent(new window.Event('visibilitychange')); });
    assert(timelines().every(t => t.paused()), 'Hidden documents suspend all drawing timelines');
    await settle(() => { visible = true; document.dispatchEvent(new window.Event('visibilitychange')); });
    assert(timelines().every(t => !t.paused()), 'Returning to the visible page resumes owned animations');
    await settle(() => document.querySelector('[aria-label="Pause project illustration animation"]').click());
    const paused = timelines().find(t => t.paused());
    assert(paused && paused.progress() === 1, 'User pause presents the complete diagram');
    assert(document.querySelector('[aria-label="Resume project illustration animation"]'));
    await settle(() => document.querySelector('[aria-label="Resume project illustration animation"]').click());
    assert(timelines().every(t => !t.paused()), 'Resume starts another drawing sequence');

    const previous = new Set(timelines());
    await settle(() => root.render(children(5)));
    assert.equal(timelines().length, 2, 'Changing projects removes the previous timeline');
    assert(timelines().filter(t => previous.has(t)).length === 1, 'The hero timeline persists while the project changes');
    assert(document.querySelector('.project-drawing').getAttribute('aria-label').includes('vault'));
    await settle(() => intersect(document.querySelector('.project-drawing'), false));
    assert(timelines().some(t => t.paused()), 'Leaving the viewport suspends the corresponding drawing');

    await settle(() => { reduced = true; root.render(children(5)); });
    assert.equal(timelines().length, 0, 'Live reduced motion removes timelines, including delayed repeats');
    assert.equal(document.querySelectorAll('.illustration-static, .instrument-static').length, 2);
    assert(!document.querySelector('[data-draw-path]').style.strokeDasharray, 'GSAP context restores the complete SVG stroke');
    assert(!document.querySelector('[data-draw-vault]').style.transform, 'GSAP context restores the untransformed model');
    await settle(() => root.unmount());
    assert.equal(observations.size, 0, 'Observers disconnect on unmount');
    assert.equal(timelines().length, 0, 'No orphan GSAP timelines remain');
    console.log('PASS: all seven SVG study alternatives, SSR-visible artwork, real DrawSVG progression, viewport/visibility pause, user pause/resume, project replacement, reduced-motion cleanup, and unmount ownership.');
  } finally {
    Module._load = originalLoad;
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

/*
 * Actual React/Radix runtime with simulated viewport and element geometry.
 * This checks fit decisions and semantics; CSS sticky layout still needs a browser.
 * Install external test deps: npm install --prefix /tmp/portfolio-check jsdom@26.1.0 typescript@5.9.3
 * Run: PORTFOLIO_TEST_DEPS=/tmp/portfolio-check/node_modules node scripts/check-sticky-projects.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire, Module } = require('node:module');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const dependency = name => require(process.env.PORTFOLIO_TEST_DEPS
    ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const req = createRequire(base + '/package.json');
const { JSDOM } = dependency('jsdom');
const ts = dependency('typescript');
const dom = new JSDOM('<html><body><header class="site-header"></header><div id="root"></div></body></html>', { url: 'https://portfolio.test', pretendToBeVisual: true });
for (const n of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'EventTarget', 'AbortController', 'AbortSignal', 'CustomEvent', 'KeyboardEvent'])
    global[n] = dom.window[n];
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
global.IS_REACT_ACT_ENVIRONMENT = true;
let measurements = 0;
let headHeight = 100;
let bodyHeight = 180;
Object.defineProperty(window, 'innerHeight', { writable: true, value: 900 });
HTMLElement.prototype.getBoundingClientRect = function () { measurements++; const height = this.classList.contains('site-header') ? 76 : this.classList.contains('ai-record-heading') ? headHeight : this.classList.contains('ai-card-body-inner') ? bodyHeight : 0; return { x: 0, y: 0, top: 0, left: 0, right: 500, bottom: height, width: 500, height, toJSON() { } }; };
const observers = new Set();
global.ResizeObserver = window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.add(this); }
    observe(t) { this.targets.add(t); }
    unobserve(t) { this.targets.delete(t); }
    disconnect() { observers.delete(this); }
};
global.IntersectionObserver = window.IntersectionObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
};
window.matchMedia = () => ({ matches: false, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { } });
require.extensions['.css'] = () => { };
require.extensions['.tsx'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, f);
const React = req('react');
const { act } = React;
const old = Module._load;
Module._load = function (r, p, m) { if (r === '@phosphor-icons/react')
    return { Brain: () => null, CaretDown: () => null }; return old.call(this, r, p, m); };
const { createRoot } = req('react-dom/client');
const ProjectDisclosures = req(base + '/app/ProjectDisclosures.tsx').default;
const items = ['loopproof', 'qofeno', 'agentx'].map((id, index) => ({ id, name: 'Project ' + index, tag: 'Product', status: 'Building', blurb: 'Original content ' + id, why: 'Original explanation ' + id, stack: ['React', 'TypeScript'] }));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
    let root = createRoot(document.getElementById('root'));
    try {
        await act(async () => root.render(React.createElement(ProjectDisclosures, { items })));
        await act(async () => wait(40));
        const stack = document.querySelector('.ai-project-stack');
        assert.equal(stack.dataset.stickyMode, 'cards');
        assert.deepEqual([...stack.querySelectorAll('.ai-card')].map(x => x.style.getPropertyValue('--ai-pin-top')), ['96px', '204px', '312px']);
        assert.equal(stack.children.length, 3, 'Direct cards have no transformed reveal wrapper');
        for (const observer of observers)
            for (const target of observer.targets)
                assert(!target.classList.contains('ai-card-body'), 'Never observe animated body height');
        const before = measurements;
        await act(async () => window.dispatchEvent(new dom.window.Event('scroll')));
        await act(async () => wait(40));
        assert.equal(measurements, before, 'Scrolling must not trigger JS layout measurement');
        headHeight = 140;
        bodyHeight = 430;
        window.innerHeight = 667;
        stack.style.setProperty('--portfolio-sticky-top', '84px');
        await act(async () => window.dispatchEvent(new dom.window.Event('resize')));
        await act(async () => wait(40));
        assert.equal(stack.dataset.stickyMode, 'headings', 'Tall mobile content uses pinned headings and natural page scrolling');
        assert.deepEqual([...stack.querySelectorAll('.ai-card')].map(x => x.style.getPropertyValue('--ai-pin-top')), ['88px', '88px', '88px']);
        const triggers = [...stack.querySelectorAll('.ai-card-head')];
        await act(async () => triggers[1].click());
        await act(async () => wait(40));
        assert.equal(stack.dataset.stickyMode, 'headings', 'Opening content must not change the stable pin mode');
        assert.equal(triggers[1].getAttribute('aria-expanded'), 'true');
        assert.equal(document.querySelector('#ai-body-qofeno').getAttribute('aria-hidden'), 'false');
        assert(!document.querySelector('#ai-body-qofeno').hasAttribute('inert'));
        await act(async () => { triggers[0].focus(); triggers[0].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
        assert.equal(document.activeElement, triggers[1], 'Radix arrow navigation remains intact');
        window.innerHeight = 220;
        await act(async () => window.dispatchEvent(new dom.window.Event('resize')));
        await act(async () => wait(40));
        assert.equal(stack.dataset.stickyMode, 'flow', 'Very short viewport never traps content under sticky headers');
        for (const item of items) {
            assert(stack.textContent.includes(item.blurb));
            assert(stack.textContent.includes(item.why));
        }
        console.log('PASS: desktop sticky offsets, mobile tall-content pinned-heading fallback, short-screen flow, direct card structure, all original content, Radix expansion/keyboard navigation, and zero scroll-driven JS layout reads. CSS sticky positioning requires production browser verification.');
    }
    finally {
        await act(async () => root.unmount());
        dom.window.close();
    }
})().catch(e => { console.error(e); process.exitCode = 1; });

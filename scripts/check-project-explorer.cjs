/* Exercise the actual React + Motion component. Only the already-tested SVG
 * illustration is replaced with a small index marker. Native touch scrolling
 * and CSS geometry still require narrow/wide browser checks.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-project-explorer.cjs
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
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'EventTarget', 'CustomEvent', 'KeyboardEvent', 'AbortController', 'AbortSignal']) global[name] = dom.window[name];
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
const intersections = new Set();
class MockIntersectionObserver {
  constructor(callback) { this.callback = callback; this.targets = new Set(); intersections.add(this); }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); intersections.delete(this); }
}
global.IntersectionObserver = window.IntersectionObserver = MockIntersectionObserver;
const uncover = target => {
  for (const observer of intersections) if (observer.targets.has(target)) {
    observer.callback([{ target, isIntersecting: true, intersectionRatio: 1 }]);
  }
};
let reduced = true;
let scrollRequests = 0;
HTMLElement.prototype.scrollIntoView = () => { scrollRequests++; };
window.scrollTo = () => { scrollRequests++; };
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
require.extensions['.css'] = () => {};
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const React = req('react');
const { act } = React;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === './ProjectIllustration') return { __esModule: true, default: ({ index }) => React.createElement('svg', { 'data-study-index': index }) };
  if (request === './MotionPreferences') return { usePortfolioMotion: () => ({ reduced, ready: true }) };
  if (request === '@phosphor-icons/react') return { ArrowRight: () => null, ArrowUpRight: () => null, GithubLogo: () => null };
  return originalLoad.call(this, request, parent, isMain);
};
const { createRoot } = req('react-dom/client');
const { renderToString } = req('react-dom/server');
const ProjectExplorer = req(path.join(base, 'app/ProjectExplorer.tsx')).default;

// Use the shipping records, including original URLs and their illustration order.
const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(base, 'app/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let initializer;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'projects') initializer = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert(initializer, 'The portfolio must retain its project records');
const dataModule = { exports: {} };
new Function('module', ts.transpileModule(`module.exports = ${initializer}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText)(dataModule);
const projects = dataModule.exports;
const root = createRoot(document.getElementById('root'));
const title = () => document.getElementById('selected-project-title').textContent;
const options = () => [...document.querySelectorAll('#project-options button')];
const filter = label => [...document.querySelectorAll('[aria-label="Filter projects"] button')].find(button => button.textContent.startsWith(label));
const option = label => options().find(button => button.textContent.includes(label));
const click = async element => { assert(element, 'Control exists'); await act(async () => element.click()); };
const selectedOption = () => options().find(button => button.getAttribute('aria-pressed') === 'true');
const summaryTitle = () => document.getElementById('selected-project-title');
const settle = duration => act(async () => new Promise(resolve => setTimeout(resolve, duration)));
const assertOneLiveProject = expected => {
  assert.equal(document.querySelectorAll('#selected-project-title').length, 1, 'No exiting duplicate titles remain');
  assert.equal(document.querySelectorAll('.project-explorer-link-primary').length, 1, 'No exiting stale project link remains keyboard-active');
  assert.equal(document.querySelector('.project-explorer-link-primary').getAttribute('href'), expected[5], 'Destination updates immediately');
  assert.equal(document.querySelector('.project-explorer-link-source').getAttribute('href'), expected[6]);
};

(async () => {
  try {
    const serverHtml = renderToString(React.createElement(ProjectExplorer, { projects }));
    assert(serverHtml.includes('House Price Prediction') && serverHtml.includes(projects[0][5]), 'Critical project content and destinations exist in SSR');
    assert(!serverHtml.includes('opacity:0;') && !serverHtml.includes('visibility:hidden'), 'The initial project is not hidden pending hydration');
    await act(async () => root.render(React.createElement(ProjectExplorer, { projects })));
    assert.equal(projects.length, 7);
    assert.equal(options().length, 7);
    assert.equal(filter('All').textContent, 'All7');
    assert.equal(filter('Machine learning').textContent, 'Machine learning4');
    assert.equal(filter('Python apps').textContent, 'Python apps3');
    assert.equal(title(), 'House Price Prediction');

    await act(async () => { option('Bank Management').focus(); option('Bank Management').dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true })); });
    assert.equal(title(), 'House Price Prediction', 'Browsing with focus or hover must not change the selected content');
    assert.equal(document.activeElement, option('Bank Management'));
    assert(options().every(button => button.tagName === 'BUTTON' && button.type === 'button'), 'Project choices retain native keyboard activation');
    await click(option('Bank Management'));
    assert.equal(title(), 'Bank Management');
    assert.equal(document.activeElement, option('Bank Management'), 'Selection must not move keyboard focus into the content');
    await click(filter('Python apps'));
    assert.equal(options().length, 3);
    assert.equal(title(), 'Bank Management', 'Changing a filter preserves the matching selection');
    assert.equal(document.querySelector('[data-study-index]').dataset.studyIndex, '5', 'Filtering preserves the original illustration mapping');
    await click(filter('Machine learning'));
    assert.equal(options().length, 4);
    assert.equal(title(), 'House Price Prediction', 'A nonmatching selection falls back to the first matching project');
    await click(option('Heart Disease Prediction'));
    await click(filter('All'));
    assert.equal(title(), 'Heart Disease Prediction');

    for (const [number, name, category, description, stack, appUrl, sourceUrl] of projects) {
      await click(option(name));
      assert.equal(title(), name);
      assert.equal(document.querySelector('.project-explorer-description').textContent, description);
      assert.equal(document.querySelector('figcaption').textContent, `Concept study · ${category}`);
      assert.deepEqual([...document.querySelectorAll('[aria-label="Technologies"] li')].map(item => item.textContent), stack);
      assert.equal(document.querySelector('.project-explorer-link-primary').getAttribute('href'), appUrl);
      assert.equal(document.querySelector('.project-explorer-link-source').getAttribute('href'), sourceUrl);
      assert.equal(document.querySelector('[data-study-index]').dataset.studyIndex, String(Number(number) - 1));
      assert.equal(options().filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
      assert(selectedOption().textContent.includes(name));
      assert.equal(document.querySelector('[role="status"]').textContent, `Showing ${name}`);
      assert.equal(summaryTitle().style.opacity, '1', 'Reduced motion presents fully visible content immediately');
      assert.equal(summaryTitle().style.transform, 'none');
    }
    assert.equal(scrollRequests, 0, 'Project and filter activation must not jump the page');
    reduced = false;
    await act(async () => root.render(React.createElement(ProjectExplorer, { projects })));
    const firstRow = document.querySelector('#project-options > li');
    await act(async () => uncover(firstRow));
    await settle(100);
    assert.notEqual(firstRow.querySelector('.project-explorer-row-arrival').style.transform, 'none', 'A newly visible row has an intermediate arrival transform');
    const hiddenRow = document.querySelector('#project-options > li:last-child .project-explorer-row-arrival');
    assert.equal(hiddenRow.style.transform, 'none', 'Rows outside the visible area do not spend their arrival early');

    const primaryLink = document.querySelector('.project-explorer-link-primary');
    await click(option('Student Management'));
    assertOneLiveProject(projects[3]);
    await settle(100);
    assert.notEqual(summaryTitle().style.transform, 'none', 'Project text visibly moves through an intermediate state');
    assert(Number(summaryTitle().style.opacity) >= 0.65, 'Critical project text stays readable during the transition');
    assert.equal(document.querySelector('.project-explorer-content').dataset.direction, '-1', 'Moving to an earlier project changes transition direction');
    assert.notEqual(document.querySelector('.project-explorer-illustration').style.transform, 'none');
    await settle(850);
    assert.equal(title(), 'Student Management');
    assert.equal(summaryTitle().style.opacity, '1', 'The regular Motion transition settles into fully visible content');
    assert.equal(summaryTitle().style.transform, 'none');
    assert.equal(document.querySelector('.project-explorer-illustration').style.transform, 'none');
    assert.equal(firstRow.querySelector('.project-explorer-row-arrival').style.transform, 'none');

    // Interrupt before the preceding 600ms drawing reveal has finished. State,
    // focus and link destinations remain immediate rather than waiting on exits.
    for (const index of [0, 5, 2, 6]) {
      option(projects[index][1]).focus();
      await click(option(projects[index][1]));
      assertOneLiveProject(projects[index]);
      assert.equal(title(), projects[index][1]);
      assert.equal(document.activeElement, option(projects[index][1]));
      assert.equal(document.querySelector('.project-explorer-link-primary'), primaryLink, 'Action nodes stay mounted through project changes');
    }
    assert.equal(document.querySelector('.project-explorer-content').dataset.direction, '1');
    await click(filter('Machine learning'));
    assertOneLiveProject(projects[0]);
    await click(filter('Python apps'));
    assertOneLiveProject(projects[3]);
    assert.equal(document.querySelectorAll('.project-explorer-filter-indicator').length, 1);
    assert.equal(document.querySelectorAll('.project-explorer-selection').length, 1);
    reduced = true;
    await act(async () => root.render(React.createElement(ProjectExplorer, { projects })));
    await settle(50);
    assert.equal(summaryTitle().style.opacity, '1', 'Live reduced-motion preference settles a running transition');
    assert.equal(summaryTitle().style.transform, 'none');
    assert.equal(document.querySelector('.project-explorer-illustration').style.transform, 'none');
    await settle(300);
    assert.equal(summaryTitle().style.transform, 'none', 'Canceled stagger delays must not restart motion later');
    assert.equal(document.querySelector('.project-explorer-illustration').style.opacity, '1');
    assert.equal(scrollRequests, 0, 'Rapid animated changes still never request page scrolling');
    await act(async () => root.render(React.createElement(ProjectExplorer, { projects: [] })));
    assert.equal(document.querySelector('.project-explorer-empty').textContent, 'No projects in this category yet.');
    console.log('PASS: all 7 records/links, filters, stable focus/selection, viewport-only row arrivals, visible directional/staggered transitions, rapid interruption without stale/duplicate links, live reduced-motion settling, and no automatic page scroll.');
  } finally {
    await act(async () => root.unmount());
    Module._load = originalLoad;
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

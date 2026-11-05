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

(async () => {
  try {
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
      assert.equal(document.querySelector('.project-explorer-content').style.opacity, '1', 'Reduced motion presents fully visible content immediately');
      assert.equal(document.querySelector('.project-explorer-content').style.transform, 'none');
    }
    assert.equal(scrollRequests, 0, 'Project and filter activation must not jump the page');
    reduced = false;
    await act(async () => root.render(React.createElement(ProjectExplorer, { projects })));
    await click(option('Student Management'));
    await act(async () => new Promise(resolve => setTimeout(resolve, 380)));
    assert.equal(title(), 'Student Management');
    assert.equal(document.querySelector('.project-explorer-content').style.opacity, '1', 'The regular Motion transition settles into fully visible content');
    assert.equal(document.querySelector('.project-explorer-content').style.transform, 'none');
    await act(async () => root.render(React.createElement(ProjectExplorer, { projects: [] })));
    assert.equal(document.querySelector('.project-explorer-empty').textContent, 'No projects in this category yet.');
    console.log('PASS: all 7 original records and links, derived 7/4/3 filters, stable selection/fallback, explicit activation, focus retention, original illustration mapping, polite updates, regular/reduced-motion visibility, and no automatic page scroll.');
  } finally {
    await act(async () => root.unmount());
    Module._load = originalLoad;
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

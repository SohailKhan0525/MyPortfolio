/* Actual React + Motion regression for the Terminal that ships in page.tsx.
 * Extract its declaration and data with the TS AST, avoiding a copied component
 * or mounting unrelated network/3D sections. JSDOM does not implement native
 * implicit Enter submission, so pressEnter applies that browser default only
 * when the real key handler has not prevented it.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-terminal.cjs
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
const dom = new JSDOM('<html><body><div id="root"></div><section id="contact"></section></body></html>', { url: 'https://portfolio.test', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'Event', 'EventTarget', 'CustomEvent', 'KeyboardEvent', 'AbortController', 'AbortSignal']) global[name] = dom.window[name];
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
const scrollRequests = [];
HTMLElement.prototype.scrollIntoView = function(options) { scrollRequests.push({ id: this.id, options }); };
require.extensions['.css'] = () => {};
const compilerOptions = { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true };
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions }).outputText, filename);
const originalLoad = Module._load;
let soundPlays = 0;
let soundRequests = 0;
window.addEventListener('portfolio:click-sound', () => { soundRequests++; });
Module._load = function(request, parent, isMain) {
  if (request === '@phosphor-icons/react') return { ArrowUpRight: () => null };
  // Exercise the shipping click delegation without requiring an audio device.
  if (request === 'howler') return { Howl: class { state() { return 'loaded'; } load() {} stop() {} volume() {} play() { soundPlays++; } unload() {} } };
  return originalLoad.call(this, request, parent, isMain);
};
const React = req('react');
const { act } = React;
const { createRoot } = req('react-dom/client');
const ClickSound = req(path.join(base, 'app/ClickSound.tsx')).default;
const source = ts.createSourceFile('page.tsx', fs.readFileSync(path.join(base, 'app/page.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const includedImports = new Set(['react', 'motion/react', './MotionPreferences', './MotionElements', './portfolio-scroll', '@phosphor-icons/react']);
const declarations = source.statements.filter(statement => {
  if (ts.isImportDeclaration(statement)) return includedImports.has(statement.moduleSpecifier.text);
  if (ts.isFunctionDeclaration(statement)) return ['Terminal', 'requestClickSound'].includes(statement.name?.text);
  if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.some(declaration => ['projects', 'aiEra'].includes(declaration.name.getText(source)));
  return false;
}).map(statement => statement.getText(source));
assert(declarations.some(text => text.startsWith('function Terminal(')), 'Use the shipping Terminal declaration');
const filename = path.join(base, 'app/__terminal-regression__.tsx');
const componentModule = new Module(filename, module);
componentModule.filename = filename;
componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
componentModule._compile(ts.transpileModule(`${declarations.join('\n')}\nexport { Terminal };`, { compilerOptions }).outputText, filename);
const Terminal = componentModule.exports.Terminal;
const root = createRoot(document.getElementById('root'));
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const input = () => document.querySelector('.terminal-input');
const form = () => document.querySelector('.terminal-form');
const output = () => document.querySelector('[aria-label="Terminal output"]');
const quick = command => document.querySelector(`[aria-label="Run ${command} command"]`);
const keyEvent = (key, options = {}) => new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
async function type(value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input(), value);
    input().dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  assert.equal(input().value, value, 'Typing updates the controlled input');
}
async function press(key, options) {
  const event = keyEvent(key, options);
  await act(async () => input().dispatchEvent(event));
  return event;
}
async function pressEnter() {
  const event = await press('Enter');
  assert.equal(event.defaultPrevented, false, 'Enter remains a normal form submission');
  await act(async () => form().requestSubmit());
}
async function run(value) { await type(value); await pressEnter(); }

(async () => {
  try {
    await act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(ClickSound), React.createElement(Terminal))));
    assert(input().disabled, 'Typing is disabled during boot');
    assert(document.querySelector('.terminal-submit').disabled);
    assert([...document.querySelectorAll('.terminal-chip')].every(button => button.disabled), 'Quick commands are disabled during boot');
    const initialOutput = output().textContent;
    await act(async () => quick('projects').click());
    await act(async () => form().dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(output().textContent, initialOutput, 'Boot-time activation cannot execute commands');
    await act(async () => wait(570));
    assert.equal(input().disabled, false);
    assert.equal(document.querySelector('.terminal-status').textContent.trim(), 'ready');
    assert(document.querySelector('.terminal-submit').disabled, 'An empty command cannot be submitted');

    await type('unsent input');
    for (const [command, expected] of [['projects', 'House Price Prediction'], ['ai', 'LoopProof'], ['skills', 'scikit learn'], ['about', 'Mohd Zaheer Uddin'], ['help', 'show commands']]) {
      const button = quick(command);
      const priorSoundRequests = soundRequests;
      const priorSoundPlays = soundPlays;
      await act(async () => { button.focus(); button.click(); });
      assert.equal(soundRequests - priorSoundRequests, 1, 'Each quick command emits one sound request');
      assert.equal(soundPlays - priorSoundPlays, 1, 'Delegated click handling must not double-play a quick command sound');
      assert.equal(document.activeElement, button, 'A quick command retains button focus and never opens the text input');
      assert(output().textContent.includes(`$ ${command}`), `One tap executes ${command}`);
      assert(output().textContent.includes(expected), `${command} produces its output immediately`);
      assert.equal(input().value, '', 'A quick command clears stale typed input');
    }
    assert.equal(scrollRequests.length, 0, 'Quick commands do not move the document');

    await run('  WHOAMI  ');
    assert(output().textContent.includes('$ WHOAMI'));
    assert(output().textContent.includes('CSIT undergraduate, ML & Data Science'), 'Typed Enter executes a trimmed, case-insensitive command');
    assert.equal(input().value, '');
    await type('pro');
    assert.equal((await press('Tab')).defaultPrevented, true);
    assert.equal(input().value, 'projects', 'Tab completes a known command');
    await type('does-not-exist');
    assert.equal((await press('Tab')).defaultPrevented, false, 'Unmatched Tab preserves normal focus navigation');
    await type('ab');
    assert.equal((await press('Tab', { shiftKey: true })).defaultPrevented, false, 'Shift+Tab preserves backwards focus navigation');
    assert.equal(input().value, 'ab');
    await run('skills');
    await run('about');
    await press('ArrowUp');
    assert.equal(input().value, 'about');
    await press('ArrowUp');
    assert.equal(input().value, 'skills');
    await press('ArrowDown');
    assert.equal(input().value, 'about');
    await press('ArrowDown');
    assert.equal(input().value, '', 'Returning past the newest command restores an empty prompt');

    await run('contact');
    assert.deepEqual(scrollRequests, [{ id: 'contact', options: { behavior: 'auto', block: 'start' } }], 'Contact navigates using reduced-motion-safe scrolling');
    await run('clear');
    await act(async () => wait(60));
    assert.equal(output().textContent, '', 'Clear empties terminal output');
    await press('ArrowUp');
    assert.equal(input().value, '', 'Clear also removes recall history');

    for (let index = 0; index < 40; index++) await run(`missing-${String(index).padStart(2, '0')}`);
    await act(async () => wait(80));
    assert(output().textContent.includes('command not found: missing-39'));
    assert(output().textContent.includes('type "help" to see available commands'));
    assert(output().children.length <= 14, 'Long sessions keep the visible output bounded');
    assert(!output().textContent.includes('missing-00'), 'Old output leaves the visible window');
    await press('ArrowUp');
    assert.equal(input().value, 'missing-39', 'Newest command remains recallable');
    for (let index = 0; index < 50; index++) await press('ArrowUp');
    assert.notEqual(input().value, 'missing-00', 'Long sessions discard old recall history rather than growing without a bound');
    const oldestRetained = input().value;
    await press('ArrowUp');
    assert.equal(input().value, oldestRetained, 'Recall stops cleanly at the retained history boundary');
    console.log('PASS: boot guards, one-tap commands without input focus or duplicate sound, typed Enter form submission, trimming/case handling, Tab/Shift+Tab, history navigation, clear, reduced-motion contact navigation, and bounded visible/retained history. Native mobile keyboard behavior still requires browser verification.');
  } finally {
    await act(async () => root.unmount());
    Module._load = originalLoad;
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

/* Real React + Motion regression for section/route choreography.
 * Simulates viewport entry and the OS preference, not Motion's animation driver.
 * Intermediate transforms are required: a final opacity of one is not proof of
 * animation. JSDOM does not validate clipping geometry or physical-device FPS.
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom-and-typescript/node_modules node scripts/check-section-transitions.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const repository = path.resolve(__dirname, '..');
const dependency = name => require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, name) : name);
const { JSDOM } = dependency('jsdom');
const ts = dependency('typescript');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://portfolio.test/', pretendToBeVisual: true,
});
for (const name of ['window', 'document', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'NodeList', 'EventTarget', 'AbortController', 'AbortSignal', 'localStorage']) {
  global[name] = dom.window[name];
}
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const frames = new Set();
global.requestAnimationFrame = callback => {
  const id = setTimeout(() => { frames.delete(id); callback(performance.now()); }, 16);
  frames.add(id);
  return id;
};
global.cancelAnimationFrame = id => { clearTimeout(id); frames.delete(id); };
window.requestAnimationFrame = global.requestAnimationFrame;
window.cancelAnimationFrame = global.cancelAnimationFrame;
global.IS_REACT_ACT_ENVIRONMENT = true;
const preferenceListeners = new Set();
const media = {
  matches: false, media: '(prefers-reduced-motion: reduce)',
  addEventListener(_, listener) { preferenceListeners.add(listener); },
  removeEventListener(_, listener) { preferenceListeners.delete(listener); },
  addListener(listener) { preferenceListeners.add(listener); },
  removeListener(listener) { preferenceListeners.delete(listener); },
};
window.matchMedia = () => media;
const observations = new Map();
global.IntersectionObserver = window.IntersectionObserver = class {
  constructor(callback) { this.callback = callback; this.targets = new Set(); }
  observe(target) { this.targets.add(target); observations.set(target, this); }
  unobserve(target) { this.targets.delete(target); observations.delete(target); }
  disconnect() { for (const target of this.targets) observations.delete(target); this.targets.clear(); }
};
const intersect = (target, visible) => {
  const observer = observations.get(target);
  assert(observer, `Expected a viewport observer for ${target.className}`);
  observer.callback([{ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
  return observer;
};
require.extensions['.css'] = () => {};
require.extensions['.ts'] = require.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { renderToString } = require('react-dom/server');
const Provider = require(path.join(repository, 'app/MotionPreferences.tsx')).default;
const { SectionHeading, Reveal } = require(path.join(repository, 'app/MotionElements.tsx'));
const Template = require(path.join(repository, 'app/template.tsx')).default;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const el = React.createElement;
const application = content => el(Provider, null, content);
const sectionContent = () => el(React.Fragment, null,
  el(SectionHeading, { title: 'Selected projects' }, 'Seven working Python and ML projects.'),
  el(SectionHeading, { title: 'Tools I use' }, 'The libraries behind the work.'),
  el(Reveal, { variant: 'lift', className: 'probe-lift' }, el('p', null, 'Readable lift content')),
  el(Reveal, { variant: 'slide', className: 'probe-slide' }, el('p', null, 'Readable slide content')),
  el(Reveal, { variant: 'panel', className: 'probe-panel' }, el('article', null, 'Readable working panel')));
const routeContent = () => el(Template, null,
  el('header', { id: 'route-header', style: { position: 'sticky', top: 0 } }, 'Persistent navigation'),
  el('main', { id: 'route-main' },
    el('section', { className: 'resume-top' }, el('h1', null, 'Resume opening')),
    el('section', { id: 'route-body' }, 'Long route body stays still')));
const transformValue = (node, kind, fallback = 0) => {
  const text = node.style.transform;
  if (!text || text === 'none') return fallback;
  const match = text.match(new RegExp(`${kind}\\(([-\\d.]+)(?:px|%)?\\)`));
  return match ? Number(match[1]) : fallback;
};
const settled = node => {
  assert.equal(transformValue(node, 'translateX'), 0, 'Horizontal motion is settled');
  assert.equal(transformValue(node, 'translateY'), 0, 'Vertical motion is settled');
  assert.equal(transformValue(node, 'scale', 1), 1, 'Scale is settled');
  assert.equal(Number(node.style.opacity || 1), 1, 'Content is fully readable');
};
const setReduced = async value => act(async () => {
  media.matches = value;
  for (const listener of preferenceListeners) listener(media);
});

(async () => {
  let root;
  try {
    const serverMarkup = renderToString(application(sectionContent()));
    const parsed = new JSDOM(serverMarkup).window.document;
    assert.deepEqual([...parsed.querySelectorAll('h2')].map(node => node.getAttribute('aria-label')), ['Selected projects', 'Tools I use']);
    assert([...parsed.querySelectorAll('h2')].every(node => node.textContent.trim().length > 0), 'Server headings contain visible text');
    assert([...parsed.querySelectorAll('.section-title-word, .motion-reveal-content')].every(node => !node.getAttribute('style')), 'Server content is not hidden pending hydration');
    assert(serverMarkup.includes('Seven working Python and ML projects.'), 'Supporting copy is in server HTML');
    assert(renderToString(application(routeContent())).includes('Resume opening'), 'Route opening is readable on the server');

    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(application(sectionContent())));
    await act(async () => wait(80));
    const titles = [...document.querySelectorAll('.section-title')];
    const words = [...titles[0].querySelectorAll('.section-title-word')];
    const offscreenWord = titles[1].querySelector('.section-title-word');
    const lift = document.querySelector('.probe-lift');
    const slide = document.querySelector('.probe-slide');
    const panel = document.querySelector('.probe-panel');
    for (const node of [titles[0], titles[1], lift, slide, panel]) assert(observations.has(node), 'Each section target has independent viewport observation');
    for (const node of [...words, offscreenWord, lift.firstElementChild, slide.firstElementChild, panel.firstElementChild]) settled(node);
    let firstObserver;
    await act(async () => {
      firstObserver = intersect(titles[0], true);
      intersect(lift, true);
      intersect(slide, true);
      intersect(panel, true);
    });
    await act(async () => wait(120));
    const wordY = transformValue(words[0], 'translateY');
    assert(wordY > 0 && wordY < 105, `Section title must interpolate in percent, got ${words[0].style.transform}`);
    assert(transformValue(words[1], 'translateY') > wordY, 'Later title words follow a real stagger');
    assert(transformValue(lift.firstElementChild, 'translateY') > 0 && transformValue(lift.firstElementChild, 'translateY') < 24, 'Lift variant visibly interpolates');
    assert(transformValue(slide.firstElementChild, 'translateX') > 0 && transformValue(slide.firstElementChild, 'translateX') < 22, 'Slide variant visibly interpolates horizontally');
    assert.equal(transformValue(slide.firstElementChild, 'translateY'), 0, 'Slide does not inherit the vertical lift');
    assert(transformValue(panel.firstElementChild, 'translateY') > 0 && transformValue(panel.firstElementChild, 'translateY') < 32, 'Panel variant visibly interpolates vertically');
    assert(transformValue(panel.firstElementChild, 'scale', 1) > 0.975 && transformValue(panel.firstElementChild, 'scale', 1) < 1, 'Panel visibly settles its scale');
    settled(offscreenWord);
    assert(!observations.has(titles[0]), 'An entered title stops observing after its one reveal');
    await act(async () => wait(850));
    words.forEach(settled);
    for (const node of [lift, slide, panel]) settled(node.firstElementChild);
    // Even a late queued observer record must not replay an already entered title.
    await act(async () => firstObserver.callback([{ target: titles[0], isIntersecting: false, intersectionRatio: 0 }, { target: titles[0], isIntersecting: true, intersectionRatio: 1 }]));
    await act(async () => wait(80));
    words.forEach(settled);

    await act(async () => intersect(titles[1], true));
    await act(async () => wait(100));
    assert(transformValue(offscreenWord, 'translateY') > 0, 'A later section animates when its own title arrives');
    await setReduced(true);
    await act(async () => wait(48));
    [...document.querySelectorAll('.section-title-word')].forEach(settled);
    for (const node of [lift, slide, panel]) settled(node.firstElementChild);
    await setReduced(false);
    await act(async () => wait(100));
    [...document.querySelectorAll('.section-title-word')].forEach(settled);
    assert.equal(document.querySelectorAll('.section-title').length, 2, 'Live preference changes do not remount or duplicate headings');
    assert(transformValue(panel.firstElementChild, 'scale', 1) < 1, 'Full-motion panels resume their visible entrance');
    assert(transformValue(slide.firstElementChild, 'translateX') > 0, 'Full-motion slides resume their visible entrance');
    await setReduced(true);
    await act(async () => wait(48));
    for (const node of [lift, slide, panel]) settled(node.firstElementChild);
    await setReduced(false);

    await act(async () => root.render(application(routeContent())));
    await act(async () => wait(100));
    const opening = document.querySelector('.resume-top');
    const routeY = transformValue(opening, 'translateY');
    assert(routeY > 0 && routeY < 22, `Route opening must animate, got ${opening.style.transform}`);
    for (const selector of ['.page-transition', '#route-header', '#route-main', '#route-body']) {
      const node = document.querySelector(selector);
      assert(!node.style.transform || node.style.transform === 'none', `${selector} must not become a transformed fixed/sticky ancestor`);
      assert(!node.style.opacity || node.style.opacity === '1', `${selector} must not fade the whole page`);
    }
    await setReduced(true);
    await act(async () => wait(48));
    settled(opening);
    await setReduced(false);
    await act(async () => wait(100));
    assert(transformValue(opening, 'translateY') > 0, 'Route entry remains live after motion preference changes');
    await act(async () => root.unmount());
    root = undefined;
    // Motion may flush a render queued before cleanup; no ongoing driver may
    // remain after that final frame has drained.
    await act(async () => wait(48));
    const detachedStyle = opening.getAttribute('style');
    await act(async () => wait(100));
    assert.equal(opening.getAttribute('style'), detachedStyle, 'Unmount stops writes to detached route content');
    assert.equal(observations.size, 0, 'Unmount removes every section observer');
    assert.equal(frames.size, 0, 'Unmount leaves no animation frame loop running');

    await setReduced(true);
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(application(routeContent())));
    await act(async () => wait(80));
    settled(document.querySelector('.resume-top'));
    console.log('PASS: readable SSR, independent viewport entry, intermediate word/lift/slide/panel transforms, real stagger, one-time heading playback, live reduced-motion interruption, bounded route animation and unmount cleanup. Browser clipping geometry and device FPS are separate checks.');
  } finally {
    if (root) await act(async () => root.unmount());
    dom.window.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

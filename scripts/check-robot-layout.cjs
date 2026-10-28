/*
 * CSS cascade regression, not a browser-layout/FPS test. Uses the real global and
 * companion stylesheets, media conditions, selector matches, specificity and
 * !important. This catches the implicit second-column bug and legacy overrides.
 *
 * PORTFOLIO_TEST_DEPS=/path/to/jsdom/node_modules node scripts/check-robot-layout.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const { JSDOM } = require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, 'jsdom') : 'jsdom');
const root = path.resolve(__dirname, '..');
const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
const files = [...layout.matchAll(/import\s+["']\.\/(.+\.css)["']/g)].map(match => `app/${match[1]}`);
const globals = files.map(file => postcss.parse(fs.readFileSync(path.join(root, file), 'utf8'), { from: file }));
const companion = postcss.parse(fs.readFileSync(path.join(root, 'app/robot-companion.css'), 'utf8'));
const dom = new JSDOM(`<!doctype html><html data-motion="full"><body><section class="hero hero-with-companion section-pad">
  <div class="hero-copy"><h1>Python apps and machine learning projects.</h1><p class="hero-description"></p>
    <div class="hero-actions"><a class="button button-primary motion-control">See the work</a><button class="text-button">Copy email</button></div>
  </div>
  <figure class="robot-companion" data-loaded="false" data-failed="false" data-reduced="false"><img class="robot-poster"><div class="robot-canvas"><canvas></canvas></div></figure>
  <div class="hero-art motion-reveal"><div class="hero-terminal-real"></div><p class="hero-note"></p></div>
</section></body></html>`);
const document = dom.window.document;
const byClass = name => document.querySelector(`.${name}`);

function specificity(selector) {
  // The real stylesheets currently use ordinary selectors (no :is/:where/:has).
  // Refuse those rather than silently calculating the wrong cascade if added.
  assert.ok(!/:(?:is|where|has)\(/.test(selector), `Extend specificity support for ${selector}`);
  const clean = selector.replace(/\[[^\]]*\]/g, '.__attribute')
    .replace(/:([\w-]+)\([^)]*\)/g, ':$1');
  const ids = (clean.match(/#[\w-]+/g) || []).length;
  const classes = (clean.match(/\.[\w-]+|(?<!:):[\w-]+/g) || []).length;
  const types = clean.replace(/#[\w-]+|\.[\w-]+|::?[\w-]+/g, '')
    .split(/[\s>+~]+/).filter(token => token && token !== '*').length;
  return ids * 10000 + classes * 100 + types;
}

function mediaMatches(condition, width, reduced, print) {
  return condition.split(',').some(branch => {
    if (/\bprint\b/.test(branch) && !print) return false;
    if (/\bscreen\b/.test(branch) && print) return false;
    for (const match of branch.matchAll(/\((min|max)-(width|height)\s*:\s*([\d.]+)(px|rem|em)\)/g)) {
      const size = match[2] === 'width' ? width : 900;
      const limit = Number(match[3]) * (match[4] === 'px' ? 1 : 16);
      if (match[1] === 'max' ? size > limit : size < limit) return false;
    }
    const motion = branch.match(/prefers-reduced-motion\s*:\s*(reduce|no-preference)/);
    if (motion && reduced !== (motion[1] === 'reduce')) return false;
    return true;
  });
}

function expand(property, value) {
  if (property === 'gap') {
    const [row, column = row] = value.split(/\s+/);
    return [['row-gap', row], ['column-gap', column]];
  }
  if (property === 'padding-block') {
    const [top, bottom = top] = value.split(/\s+/);
    return [['padding-top', top], ['padding-bottom', bottom]];
  }
  if (property === 'padding') {
    const [a, b = a, c = a, d = b] = value.split(/\s+/);
    return [['padding-top', a], ['padding-right', b], ['padding-bottom', c], ['padding-left', d]];
  }
  return [[property, value]];
}

function computed(element, width, sheets, reduced = false, print = false) {
  const winners = new Map();
  let order = 0;
  for (const sheet of sheets) {
    sheet.walkRules(rule => {
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && !mediaMatches(parent.params, width, reduced, print)) return;
        if (parent.type === 'atrule' && /keyframes/.test(parent.name)) return;
      }
      for (const selector of rule.selectors) {
        // A generated pseudo-element cannot match the real host element.
        if (/::|:(?:before|after)\b/.test(selector)) continue;
        if (!element.matches(selector)) continue;
        const weight = specificity(selector);
        rule.walkDecls(declaration => {
          order++;
          for (const [property, value] of expand(declaration.prop, declaration.value)) {
            const candidate = { value, important: !!declaration.important, weight, order, selector };
            const previous = winners.get(property);
            if (!previous || Number(candidate.important) > Number(previous.important)
              || (candidate.important === previous.important && (candidate.weight > previous.weight
                || candidate.weight === previous.weight && candidate.order > previous.order))) {
              winners.set(property, candidate);
            }
          }
        });
      }
    });
  }
  return Object.fromEntries([...winners].map(([property, winner]) => [property,
    winner.value.replace(/var\((--[\w-]+)\)/g, (whole, name) => winners.get(name)?.value ?? whole)]));
}

// Client-component CSS and root CSS may be emitted in separate bundles. Scoped
// rules must beat old generic hero rules regardless of those bundle positions.
for (const sheets of [[...globals, companion], [companion, ...globals]]) {
  for (const width of [320, 375, 390, 640, 768, 900, 901, 960, 961, 1280]) {
    const hero = computed(byClass('hero'), width, sheets);
    const copy = computed(byClass('hero-copy'), width, sheets);
    const robot = computed(byClass('robot-companion'), width, sheets);
    const terminal = computed(byClass('hero-art'), width, sheets);
    const actions = computed(byClass('hero-actions'), width, sheets);
    if (width <= 960) {
      assert.equal(hero['grid-template-columns'], 'minmax(0, 1fr)', `${width}px has one explicit grid column`);
      for (const child of [copy, robot, terminal]) assert.equal(child['grid-column'], '1', `${width}px child must not create an implicit second column`);
      assert.deepEqual([robot['grid-row'], copy['grid-row'], terminal['grid-row']], ['1', '2', '3']);
      assert.ok(parseFloat(hero['row-gap']) >= 20 && parseFloat(hero['row-gap']) <= 32, `${width}px keeps deliberate spacing`);
      assert.ok(parseFloat(hero['padding-top']) <= 36, `${width}px must not inherit the old 76px top gap`);
    } else {
      assert.equal((hero['grid-template-columns'].match(/minmax\(/g) || []).length, 2, `${width}px must supply both desktop columns`);
      assert.equal(copy['grid-column'], '1');
      assert.equal(robot['grid-column'], '2');
      assert.equal(terminal['grid-column'], '2');
      assert.equal(copy['grid-row'], '1 / span 2');
    }
    assert.equal(robot.width, '100%');
    assert.equal(robot['max-width'], '100%');
    assert.equal(robot.overflow, 'hidden');
    assert.equal(robot['pointer-events'], 'none', 'Robot must not trap mobile swipes');
    assert.ok(parseFloat(robot.height) >= 220, 'Reserved stage supports readable expressions');
    assert.equal(actions['flex-wrap'], 'wrap', 'Hero actions may wrap instead of overflowing');
    if (width <= 640) {
      assert.equal(hero.width, 'calc(100% - 40px)', 'Phone text keeps 20px side gutters');
      assert.ok(Number(computed(document.querySelector('h1'), width, sheets)['line-height']) >= 1.05);
    }
  }

  const host = byClass('robot-companion');
  assert.equal(computed(byClass('robot-poster'), 390, sheets).visibility, 'hidden', 'No unrelated static face flashes during loading');
  assert.equal(computed(byClass('robot-canvas'), 390, sheets).opacity, '0');
  host.dataset.loaded = 'true';
  assert.equal(computed(byClass('robot-canvas'), 390, sheets).opacity, '1');
  assert.equal(computed(byClass('robot-poster'), 390, sheets).visibility, 'hidden');
  host.dataset.loaded = 'false';
  host.dataset.failed = 'true';
  assert.equal(computed(byClass('robot-poster'), 390, sheets).visibility, 'visible', 'Fallback appears only on a real rendering failure');
  host.dataset.failed = 'false';
  host.dataset.reduced = 'true';
  assert.equal(computed(byClass('robot-canvas'), 390, sheets).transition, 'none');
  host.dataset.reduced = 'false';
  assert.equal(computed(byClass('robot-canvas'), 390, sheets, true).transition, 'none');
  assert.equal(computed(byClass('robot-poster'), 390, sheets, false, true).visibility, 'visible');
}
console.log('PASS: actual CSS cascade at 10 phone/tablet/desktop widths, both CSS bundle orders, single mobile column, spacing, touch passthrough, clean loading/fallback states and reduced motion. Browser pixel layout is a separate check.');

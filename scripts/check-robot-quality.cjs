/* Pure active-frame budget tests; no GPU/frame-rate claim is made. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Module } = require('node:module');
const ts = require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, 'typescript') : 'typescript');
const filename = path.resolve(__dirname, '../app/robot/render-quality.ts');
const compiled = new Module(filename, module);
compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { ROBOT_DPR, createRobotRenderQuality, resetRobotQualityWindow, sampleRobotRenderQuality } = compiled.exports;
assert.equal(ROBOT_DPR, 2);
const run = (quality, count, delta) => {
  const changes = [];
  for (let i = 0; i < count; i++) {
    const next = sampleRobotRenderQuality(quality, typeof delta === 'function' ? delta(i) : delta);
    if (next !== null) changes.push(next);
  }
  return changes;
};
const steady = createRobotRenderQuality();
assert.deepEqual(run(steady, 3600, 1 / 60), [], 'Healthy playback keeps full quality');
assert.deepEqual(run(steady, 240, 1 / 120), [], 'Fast displays do not induce resolution churn');
const pressure = createRobotRenderQuality();
assert.deepEqual(run(pressure, 90, 1 / 30), [], 'Startup and one slow window are insufficient evidence');
assert.deepEqual(run(pressure, 90, 1 / 30), [1.5], 'Two sustained slow windows lower the budget');
assert.deepEqual(run(pressure, 200, 1 / 30), [], 'Cooldown prevents rapid repeated resizing');
assert.deepEqual(run(pressure, 220, 1 / 30), [1.25], 'Persistent pressure eventually reaches a bounded floor');
assert.deepEqual(run(pressure, 1200, 1 / 15), [], 'The renderer never drops below its lower bound');
assert.deepEqual(run(pressure, 1200, 1 / 144), [], 'No upward oscillation during the same mount');
const interrupted = createRobotRenderQuality();
run(interrupted, 90, 1 / 30);
resetRobotQualityWindow(interrupted);
assert.deepEqual(run(interrupted, 90, 1 / 30), [], 'Pause discards incomplete evidence');
for (const invalid of [NaN, Infinity, 0, -1, 30]) {
  assert.equal(sampleRobotRenderQuality(interrupted, invalid), null, 'Invalid/stalled timing cannot lower quality');
}
assert.deepEqual(run(interrupted, 90, 1 / 30), [], 'Resumed playback receives fresh warmup and windows');
const recovered = createRobotRenderQuality();
run(recovered, 93, 1 / 30);
assert.deepEqual(run(recovered, 130, 1 / 60), [], 'A healthy window clears isolated slow evidence');
assert.deepEqual(run(recovered, 60, 1 / 30), [], 'Only consecutive slow windows cause a change');
console.log('PASS: 2x quality, sustained evidence, cooldown, bounded 1.25x floor, pause/stall exclusion and no resolution oscillation.');

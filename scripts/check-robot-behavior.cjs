/* Pure behavior regression: no browser, WebGL, timers, or React required.
 * PORTFOLIO_TEST_DEPS=/path/to/node_modules node scripts/check-robot-behavior.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require(process.env.PORTFOLIO_TEST_DEPS ? path.join(process.env.PORTFOLIO_TEST_DEPS, 'typescript') : 'typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { createRobotAnimator, stepRobotAnimator, settleRobotAnimator } = require('../app/robot/behavior.ts');
const random = seed => () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
const run = (animator, seconds, visit = () => {}) => {
  for (let frame = 0; frame < Math.ceil(seconds * 60); frame++) visit(stepRobotAnimator(animator, 1 / 60), animator);
};

const robot = createRobotAnimator(random(87));
const pose = robot.pose;
const target = robot.target;
const observed = [robot.state];
const intervals = new Map();
let lastState = robot.state;
let maximumWave = 0;
let minimumBlink = 1;
let downRoll = 0;
let lastYaw = 0;
run(robot, 12.3, (current, animator) => {
  assert.equal(current, pose, 'Pose allocation must be stable across frames');
  assert.equal(animator.target, target, 'Target allocation must be stable across frames');
  if (animator.state !== lastState) { observed.push(animator.state); lastState = animator.state; }
  intervals.set(animator.state, (intervals.get(animator.state) || 0) + 1 / 60);
  if (animator.state !== 'idle') assert.equal(animator.blinkElapsed, -1, 'Ambient blinking waits until the scripted startup is complete');
  if (animator.state === 'hello-pause') assert.equal(current.eyeOpen, 1, 'The two-second hello pause precedes the first blink');
  if (animator.state === 'greeting') maximumWave = Math.max(maximumWave, current.rightArm);
  if (animator.state === 'blink') minimumBlink = Math.min(minimumBlink, current.eyeOpen);
  if (animator.state === 'down') downRoll = Math.max(downRoll, current.bodyRoll);
  assert(Math.abs(current.bodyYaw - lastYaw) < 0.16, 'Spin orientation remains continuous across states');
  lastYaw = current.bodyYaw;
});
assert.deepEqual(observed, ['greeting', 'hello-pause', 'blink', 'spin', 'dizzy', 'fall', 'down', 'recover', 'idle']);
assert(Math.abs(intervals.get('hello-pause') - 2) < 0.04, 'The hello pause lasts two seconds');
assert(maximumWave > 1.9, 'Greeting actually raises and waves the shoulder');
assert(minimumBlink < 0.15, 'The pre-spin blink actually closes the eyes');
assert(downRoll > 1.3, 'Startup reaches a clearly fallen pose');
assert(Math.abs(pose.bodyRoll) < 0.05, 'Recovery returns the body upright');
assert(Math.abs(pose.faceTime - robot.time) < 1e-8, 'Facial secondary motion uses the same active-only clock');

const paused = JSON.stringify(robot);
for (const delta of [0, 0, -1, NaN, Infinity]) assert.equal(stepRobotAnimator(robot, delta), pose);
assert.equal(JSON.stringify(robot), paused, 'Paused or invalid frames do not consume time or random choices');

const seen = new Set();
const expressions = new Set();
let blinkCount = 0;
let wasClosed = false;
let maxYaw = 0;
const numericKeys = Object.keys(pose).filter(key => typeof pose[key] === 'number');
run(robot, 1800, (current, animator) => {
  seen.add(animator.state);
  expressions.add(current.expression);
  for (const key of numericKeys) assert(Number.isFinite(current[key]), `${key} stays finite`);
  assert(Math.abs(current.bodyYaw - lastYaw) < 0.16, 'Ongoing spins do not snap back by a full turn');
  lastYaw = current.bodyYaw;
  maxYaw = Math.max(maxYaw, Math.abs(current.bodyYaw));
  assert(Math.abs(current.bodyX) <= 0.13 && current.bodyY <= 0.12 && current.bodyY >= 0, 'Body translation stays in its stage');
  assert(Math.abs(current.bodyRoll) < 0.25, 'Spontaneous stumbles remain small; intro fall does not repeat');
  assert(current.eyeOpen >= 0 && current.eyeOpen <= 1, 'Eyelid envelope is bounded');
  assert(current.expressionMix >= 0 && current.expressionMix <= 1, 'Face transition is bounded');
  assert(current.expressionIntensity >= 0 && current.expressionIntensity <= 1, 'Emotion acting strength stays bounded');
  if (current.eyeOpen < 0.2 && !wasClosed) blinkCount++;
  wasClosed = current.eyeOpen < 0.2;
});
for (const state of ['idle', 'look', 'tilt', 'smile', 'cry', 'angry', 'sleepy', 'wave', 'spin', 'stumble']) assert(seen.has(state), `Random schedule reaches ${state}`);
for (const expression of ['neutral', 'smile', 'cry', 'angry', 'sleepy', 'confused']) assert(expressions.has(expression), `Face reaches ${expression}`);
assert(blinkCount > 200, 'Random eyelid motion continues across different body behaviors');
assert(maxYaw <= Math.PI * 2 + 0.001, 'Long-running spins do not accumulate angle drift');

const falling = createRobotAnimator(random(1));
run(falling, 8.5);
assert(['fall', 'down'].includes(falling.state));
const settled = settleRobotAnimator(falling);
assert.equal(settled.bodyRoll, 0);
assert.equal(settled.bodyYaw, 0);
assert.equal(settled.rightArm, 0);
assert.equal(settled.eyeOpen, 1);
assert.equal(settled.expression, 'smile');
assert.equal(settled.faceTime, 0, 'Reduced motion freezes facial secondary motion in its initial pose');
assert.equal(settled.expressionIntensity, 1, 'Reduced motion preserves a clearly readable smile');
assert.equal(falling.state, 'idle', 'Live reduced motion settles an interrupted fall');
const settledCopy = JSON.stringify(falling);
stepRobotAnimator(falling, 0);
assert.equal(JSON.stringify(falling), settledCopy);
stepRobotAnimator(falling, 1 / 60);
assert(Math.abs(falling.pose.faceTime - 1 / 60) < 1e-8, 'Resumed face motion starts from the still pose without a clock jump');
run(falling, 30, (_pose, animator) => assert(!['greeting', 'fall', 'down', 'recover'].includes(animator.state), 'Restoring motion does not replay the startup accident'));

const sameA = createRobotAnimator(random(42));
const sameB = createRobotAnimator(random(42));
run(sameA, 60);
run(sameB, 60);
assert.deepEqual(sameA.pose, sameB.pose, 'Seeded animation is deterministic');
assert.equal(sameA.state, sameB.state);
const stalled = createRobotAnimator(random(4));
stepRobotAnimator(stalled, 100);
assert.equal(stalled.state, 'greeting', 'A delayed frame cannot skip the entire startup');
assert.equal(stalled.time, 0.1);

// Control only the current state, while exercising the actual target and pose
// evolution. These assertions distinguish acting choices, not source spellings.
const acting = (state, duration = 4) => {
  const animator = createRobotAnimator(random(73));
  Object.assign(animator, { state, duration, startupPhase: 8, direction: 1,
    lookDirection: 1, nextBlink: Infinity, nextGaze: Infinity });
  animator.pose.expression = animator.pose.expressionFrom = state === 'look' ? 'neutral' : state;
  return animator;
};
const blinkAt = phase => {
  const animator = acting('blink', 0.3);
  animator.elapsed = phase * 0.3 - 1 / 600;
  stepRobotAnimator(animator, 1 / 600);
  return animator.target.eyeOpen;
};
assert(blinkAt(0.2) < 0.2 && blinkAt(0.8) > 0.75, 'Lids close quickly and reopen more slowly');
assert.equal(blinkAt(0.33), 0.035, 'A short closed beat separates closing and opening');
assert.equal(blinkAt(0), 1);

const looking = acting('look');
for (let frame = 0; frame < 10; frame++) stepRobotAnimator(looking, 1 / 120);
assert(looking.pose.gazeX > 0.3 && Math.abs(looking.pose.headYaw) < 0.01, 'Eyes acquire a target before the head follows');
run(looking, 0.5);
assert(looking.pose.headYaw > 0.25 && looking.pose.gazeX > 0.65, 'The head then joins the intentional look');

const attentive = acting('idle', 20);
attentive.nextGaze = 0;
const gazes = new Set();
run(attentive, 12, (current, animator) => {
  gazes.add(`${animator.focusX.toFixed(3)}:${animator.focusY.toFixed(3)}`);
  assert(Math.abs(current.gazeX) <= 0.3 && current.gazeY >= -0.12 && current.gazeY <= 0.16, 'Idle saccades stay within the display');
});
assert(gazes.size >= 4, 'Quiet idle gaze acquires new random targets without a repeating sine loop');

const sleepy = acting('sleepy');
const sleepySamples = [];
run(sleepy, 3.8, (current, animator) => sleepySamples.push({ time: animator.elapsed, intensity: current.expressionIntensity, pitch: current.headPitch }));
const strongestYawn = Math.max(...sleepySamples.map(sample => sample.intensity));
const midYawn = sleepySamples.find(sample => sample.time > 2);
const lateYawn = sleepySamples.find(sample => sample.time > 3.5);
assert(strongestYawn > 0.9 && midYawn.intensity > 0.9 && lateYawn.intensity < 0.15, 'A yawn builds, holds briefly and closes before the next action');
assert(midYawn.pitch > 0.2 && lateYawn.pitch < midYawn.pitch, 'Sleepy head posture accompanies the yawn and recovers');

for (const state of ['cry', 'angry']) {
  const animator = acting(state);
  const strengths = [];
  const pitches = [];
  run(animator, 3.7, current => { strengths.push(current.expressionIntensity); pitches.push(current.headPitch); });
  assert(Math.max(...strengths) - Math.min(...strengths) > 0.15, `${state} has a visible acting beat rather than one frozen pose`);
  assert(Math.max(...pitches) > 0.09, `${state} uses supporting head posture`);
}
console.log('PASS: full startup timing, visible wave/fall/recovery, asymmetric blinks, eyes-leading-head gaze, randomized idle attention, coordinated yawn/sob/brace acting, active-only face clock, stable frame allocations, bounded continuous spins, and live reduced-motion recovery.');

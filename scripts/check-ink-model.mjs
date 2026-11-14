import assert from 'node:assert/strict';
import atlas from '../app/ink-prototypes.json' with { type: 'json' };
import { classifyInk, normalizeInk, INK_EXAMPLES, INK_MODEL_INFO, INK_MISREAD } from '../app/ink-model.ts';

assert.equal(classifyInk(new Float32Array(1024), 32), null);
assert.equal(normalizeInk([], 0), null);
assert.equal(normalizeInk([1], 32), null);
assert.equal(INK_MODEL_INFO.testCorrect, 349);
assert.equal(INK_MODEL_INFO.testCount, 360);
assert.equal(INK_MODEL_INFO.trainCount + INK_MODEL_INFO.testCount, 1797);
assert.equal(INK_MODEL_INFO.prototypeCount, atlas.prototypes.flat().length);

for (const sample of [...INK_EXAMPLES, INK_MISREAD]) {
  const reading = classifyInk(sample.pixels, 8);
  if (sample === INK_MISREAD) {
    assert.equal(sample.digit, 5);
    assert.deepEqual(reading.matches.slice(0, 2).map(match => match.digit), [9, 5]);
  } else assert.equal(reading.matches[0].digit, sample.digit);
  assert.equal(new Set(reading.matches.map(match => match.digit)).size, 3);
  const enlarged = new Array(32 * 32).fill(0);
  const translated = new Array(48 * 40).fill(0);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      enlarged[y * 32 + x] = sample.pixels[Math.floor(y / 4) * 8 + Math.floor(x / 4)];
      translated[(y + 3) * 48 + x + 11] = enlarged[y * 32 + x];
    }
  }
  assert.deepEqual(classifyInk(enlarged, 32), reading);
  assert.deepEqual(classifyInk(translated, 48, 40), reading);
  // Reconstruct neighbors and independently verify the reported RMS distances and rank.
  const all = atlas.prototypes.map((group, digit) => {
    const candidates = group.map(bits => {
      const pixelError = Array.from({ length: 64 }, (_, i) => reading.pixels[i] - parseInt(bits.slice(2*i, 2*i+2), 16) / 255);
      return Math.hypot(...pixelError) / 8;
    });
    return { digit, distance: Math.min(...candidates) };
  }).sort((a, b) => a.distance - b.distance || a.digit - b.digit);
  for (const [index, match] of reading.matches.entries()) {
    assert.equal(match.digit, all[index].digit);
    assert(Math.abs(match.distance - all[index].distance) < 1e-12);
    assert.equal(match.prototype.length, 64);
    const prototypeDistance = Math.hypot(...reading.pixels.map((pixel, i) => pixel - match.prototype[i])) / 8;
    assert(Math.abs(match.distance - prototypeDistance) < 1e-12);
  }
}
console.log('PASS: held-out examples, editable expansion, translated rectangular plates, empty input and independent prototype ranking/distance checks.');

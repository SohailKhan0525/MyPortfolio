import assert from 'node:assert/strict';
import { classifyBed, gardenCells, plantSample, SEED_SAMPLES, MYSTERY_BED, GRID_SIZE } from '../app/signal-garden-model.ts';

const initial = gardenCells(SEED_SAMPLES);
assert.equal(initial.length, GRID_SIZE ** 2);
assert.equal(initial.filter(cell => cell.training).length, 6);
assert.deepEqual(classifyBed(SEED_SAMPLES, MYSTERY_BED).votes, { fern: 2, poppy: 1 });

// Three equidistant votes are picked in row/column order; a self-label cannot sway its own vote.
const tied = [
  { x: 3, y: 3, species: 'fern' }, { x: 4, y: 3, species: 'poppy' },
  { x: 3, y: 4, species: 'fern' }, { x: 2, y: 3, species: 'poppy' }, { x: 3, y: 2, species: 'fern' },
];
const tie = classifyBed(tied, MYSTERY_BED);
assert.deepEqual(tie.neighbors.map(({ x, y }) => [x, y]), [[3, 2], [2, 3], [4, 3]]);
assert.equal(tie.species, 'poppy');
assert.deepEqual(classifyBed(tied.toReversed(), MYSTERY_BED), tie);
const shown = gardenCells(tied).find(({ x, y }) => x === 3 && y === 3);
assert.equal(shown.training, 'fern');
assert.equal(shown.prediction, 'poppy');

// The mystery only changes through nearby training examples. An early undo restores the exact result.
const first = plantSample(SEED_SAMPLES, { x: 3, y: 2 }, 'poppy');
const afterFirst = gardenCells(first);
assert(afterFirst.some((cell, index) => cell.prediction !== initial[index].prediction));
assert.equal(classifyBed(first, MYSTERY_BED).species, 'fern');
const second = plantSample(first, { x: 4, y: 3 }, 'poppy');
assert.equal(classifyBed(second, MYSTERY_BED).species, 'poppy');
assert.deepEqual(gardenCells(first), afterFirst);
assert.deepEqual(gardenCells(SEED_SAMPLES), initial);
for (const invalid of [MYSTERY_BED, { x: 7, y: 0 }, { x: 0, y: -1 }, { x: 1.5, y: 0 }]) {
  assert.equal(plantSample(first, invalid, 'fern'), first);
}
assert.equal(plantSample(first, { x: 3, y: 2 }, 'poppy'), first);
const replaced = plantSample(first, { x: 3, y: 2 }, 'fern');
assert.equal(replaced.length, first.length);
assert.equal(replaced.find(({ x, y }) => x === 3 && y === 2).species, 'fern');
console.log('PASS: stable nearest-neighbor votes, separate labels and predictions, two-move mystery, immutable undo/reset and protected beds.');

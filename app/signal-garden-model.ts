export type Species = "fern" | "poppy";
export type Point = Readonly<{ x: number; y: number }>;
export type Sample = Point & Readonly<{ species: Species }>;
export type GardenCell = Point & Readonly<{ prediction: Species; training: Species | null }>;

export const GRID_SIZE = 7;
export const MYSTERY_BED: Point = { x: 3, y: 3 };
export const SEED_SAMPLES: readonly Sample[] = [
  { x: 0, y: 1, species: "fern" },
  { x: 2, y: 2, species: "fern" },
  { x: 1, y: 5, species: "poppy" },
  { x: 4, y: 1, species: "fern" },
  { x: 5, y: 4, species: "poppy" },
  { x: 6, y: 6, species: "poppy" },
];

export function isSameBed(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function squaredDistance(a: Point, b: Point) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** A bed cannot cast a vote for its own prediction, even when it is labeled. */
export function classifyBed(samples: readonly Sample[], point: Point) {
  const neighbors = samples
    .filter(sample => !isSameBed(sample, point))
    .sort((a, b) => squaredDistance(a, point) - squaredDistance(b, point) || a.y - b.y || a.x - b.x)
    .slice(0, 3);
  if (!neighbors.length) throw new RangeError("A prediction needs at least one other labeled bed.");

  const votes = { fern: 0, poppy: 0 };
  for (const sample of neighbors) votes[sample.species]++;
  // The starter garden always supplies three votes. With just two, the nearer plant breaks a tie.
  const species = votes.fern === votes.poppy ? neighbors[0].species : votes.fern > votes.poppy ? "fern" : "poppy";
  return { species, neighbors, votes };
}

export function gardenCells(samples: readonly Sample[]): GardenCell[] {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const point = { x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) };
    return {
      ...point,
      prediction: classifyBed(samples, point).species,
      training: samples.find(sample => isSameBed(sample, point))?.species ?? null,
    };
  });
}

/** Repeated plantings on one bed replace its label. Old arrays remain valid undo snapshots. */
export function plantSample(samples: readonly Sample[], point: Point, species: Species): readonly Sample[] {
  const inBounds = Number.isInteger(point.x) && Number.isInteger(point.y)
    && point.x >= 0 && point.x < GRID_SIZE && point.y >= 0 && point.y < GRID_SIZE;
  if (!inBounds || isSameBed(point, MYSTERY_BED)) return samples;

  const previous = samples.find(sample => isSameBed(sample, point));
  if (previous?.species === species) return samples;
  const next: Sample = { x: point.x, y: point.y, species };
  if (!previous) return [...samples, next];
  return samples.map(sample => sample === previous ? next : sample);
}

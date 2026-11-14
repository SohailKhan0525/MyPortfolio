import { normalizeInk } from "./ink-normalize.mjs";
import atlas from "./ink-prototypes.json" with { type: "json" };

export { normalizeInk };
export type InkMatch = { digit: number; distance: number; prototype: readonly number[] };
export type InkReading = { pixels: number[]; matches: InkMatch[] };

const SIZE = 64;

function unpackBytes(encoded: string): number[] {
  return Array.from({ length: SIZE }, (_, index) => parseInt(encoded.slice(index * 2, index * 2 + 2), 16) / 255);
}

const prototypes = atlas.prototypes.map(group => group.map(unpackBytes));
export const INK_MODEL_INFO = atlas.info;

function unpackExample(example: { digit: number; raw: string }) {
  // The unprocessed UCI examples have 17 possible ink levels, from 0 to 16.
  return { digit: example.digit, pixels: [...example.raw].map(level => parseInt(level, 17) / 16) };
}

export const INK_EXAMPLES = atlas.examples.map(unpackExample);
export const INK_MISREAD = unpackExample(atlas.misread);

export function classifyInk(raw: ArrayLike<number>, width: number, height = width): InkReading | null {
  const pixels = normalizeInk(raw, width, height);
  if (!pixels) return null;
  const candidates = prototypes.map((group, digit) => {
    let minimum = Infinity;
    let nearest = group[0];
    for (const prototype of group) {
      let squaredDistance = 0;
      for (let i = 0; i < SIZE; i++) {
        squaredDistance += (pixels[i] - prototype[i]) ** 2;
      }
      if (squaredDistance < minimum) {
        minimum = squaredDistance;
        nearest = prototype;
      }
    }
    return { digit, prototype: nearest, distance: Math.sqrt(minimum / SIZE) };
  });
  candidates.sort((a, b) => a.distance - b.distance || a.digit - b.digit);
  return { pixels, matches: candidates.slice(0, 3) };
}

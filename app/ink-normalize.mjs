const SIDE = 8;
const SIZE = SIDE * SIDE;

/** Crop and area-average into an 8×8 plate. Zero is blank paper; one is full ink.
 * @param {ArrayLike<number>} raw
 * @param {number} width
 * @param {number} [height]
 * @returns {number[] | null}
 */
export function normalizeInk(raw, width, height = width) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || raw.length !== width * height) {
    return null;
  }
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!(raw[y * width + x] > 0.1)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) return null;
  const inkWidth = right - left + 1;
  const inkHeight = bottom - top + 1;
  const scale = Math.min(7 / inkWidth, 7.5 / inkHeight);
  const offsetX = (SIDE - inkWidth * scale) / 2;
  const offsetY = (SIDE - inkHeight * scale) / 2;
  const pixels = Array(SIZE).fill(0);

  // Accumulate the exact area of each input pixel inside each output bin. This also
  // works when a sample is a low-resolution grid rather than a high-resolution pen stroke.
  for (let y = top; y <= bottom; y++) {
    const y0 = offsetY + (y - top) * scale;
    const y1 = y0 + scale;
    for (let x = left; x <= right; x++) {
      const value = raw[y * width + x];
      if (!(value > 0)) continue;
      const x0 = offsetX + (x - left) * scale;
      const x1 = x0 + scale;
      for (let row = Math.max(0, Math.floor(y0)); row < Math.min(SIDE, Math.ceil(y1)); row++) {
        const overlapY = Math.min(row + 1, y1) - Math.max(row, y0);
        for (let col = Math.max(0, Math.floor(x0)); col < Math.min(SIDE, Math.ceil(x1)); col++) {
          const overlapX = Math.min(col + 1, x1) - Math.max(col, x0);
          pixels[row * SIDE + col] += Math.min(1, value) * overlapX * overlapY;
        }
      }
    }
  }
  // Match the peak brightness and stored 8-bit precision of the training examples.
  const peak = Math.max(...pixels);
  return pixels.map(value => Math.round(255 * value / peak) / 255);
}

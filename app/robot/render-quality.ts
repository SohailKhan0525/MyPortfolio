/** The companion is a small canvas: a crisp 2x backing buffer, not a full-page
 * 4K render. Only sustained active-frame pressure can lower its pixel budget. */
export const ROBOT_DPR = 2;
const QUALITY_LEVELS = [ROBOT_DPR, 1.5, 1.25] as const;
const WINDOW_SECONDS = 2;
const SLOW_FRAME_SECONDS = 1 / 42;

export interface RobotRenderQuality {
  level: number;
  warmup: number;
  cooldown: number;
  seconds: number;
  samples: number;
  slowWindows: number;
}

export function createRobotRenderQuality(): RobotRenderQuality {
  return { level: 0, warmup: 1, cooldown: 0, seconds: 0, samples: 0, slowWindows: 0 };
}

/** Pauses discard incomplete evidence but preserve the already selected budget. */
export function resetRobotQualityWindow(quality: RobotRenderQuality): void {
  quality.warmup = 1;
  quality.seconds = 0;
  quality.samples = 0;
  quality.slowWindows = 0;
}

/** Returns a new DPR at most twice during one mount. No allocations or React
 * updates per frame, no upward oscillation, no conclusions from a single stall. */
export function sampleRobotRenderQuality(quality: RobotRenderQuality, delta: number): number | null {
  if (quality.level >= QUALITY_LEVELS.length - 1) return null;
  if (!Number.isFinite(delta) || delta <= 0 || delta > 0.25) {
    resetRobotQualityWindow(quality);
    return null;
  }
  if (quality.warmup > 0) { quality.warmup -= delta; return null; }
  if (quality.cooldown > 0) { quality.cooldown -= delta; return null; }
  quality.seconds += delta;
  quality.samples++;
  if (quality.seconds < WINDOW_SECONDS || quality.samples < 20) return null;
  const slow = quality.seconds / quality.samples > SLOW_FRAME_SECONDS;
  quality.slowWindows = slow ? quality.slowWindows + 1 : 0;
  quality.seconds = 0;
  quality.samples = 0;
  if (quality.slowWindows < 2) return null;
  quality.level++;
  quality.slowWindows = 0;
  quality.cooldown = 8;
  return QUALITY_LEVELS[quality.level];
}

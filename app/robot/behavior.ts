/**
 * The robot has one body-behavior state at a time. Blinking is an independent
 * eyelid envelope, composed with (rather than replacing) the current expression.
 * Time advances only when the scene calls stepRobotAnimator: no timers or DOM.
 */
export type RobotExpression = "neutral" | "smile" | "cry" | "angry" | "sleepy" | "dizzy" | "confused";
export type RobotState = "greeting" | "hello-pause" | "blink" | "spin" | "dizzy" | "fall" | "down" | "recover" | "idle" | "look" | "tilt" | "smile" | "cry" | "angry" | "sleepy" | "wave" | "stumble";

export interface RobotPose {
  bodyRoll: number;
  bodyYaw: number;
  bodyY: number;
  bodyX: number;
  headYaw: number;
  headTilt: number;
  headPitch: number;
  /** Shoulder Z rotations; positive raises the arm on the robot's +X side. */
  leftArm: number;
  rightArm: number;
  eyeOpen: number;
  gazeX: number;
  gazeY: number;
  expression: RobotExpression;
  expressionFrom: RobotExpression;
  expressionMix: number;
}

export interface RobotAnimator {
  readonly pose: RobotPose;
  readonly target: RobotPose;
  readonly random: () => number;
  state: RobotState;
  elapsed: number;
  duration: number;
  time: number;
  startupPhase: number;
  yawBase: number;
  spinDirection: number;
  direction: number;
  lookDirection: number;
  lastAction: RobotState;
  nextBlink: number;
  blinkElapsed: number;
}

const TURN = Math.PI * 2;
const FALL_ROLL = 1.36;
const STARTUP_STATES: readonly RobotState[] = ["greeting", "hello-pause", "blink", "spin", "dizzy", "fall", "down", "recover"];
const STARTUP_DURATIONS = [2.4, 2, 0.3, 1.5, 1.35, 0.7, 1.8, 2.1] as const;
const POSE_KEYS = ["bodyRoll", "bodyYaw", "bodyY", "bodyX", "headYaw", "headTilt", "headPitch", "leftArm", "rightArm", "eyeOpen", "gazeX", "gazeY"] as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const x = clamp01(value); return x * x * x * (x * (x * 6 - 15) + 10); };
const envelope = (elapsed: number, duration: number, edge = 0.5) => smooth(elapsed / edge) * smooth((duration - elapsed) / edge);
const sample = (animator: RobotAnimator, min: number, max: number) => min + clamp01(animator.random()) * (max - min);

function createPose(): RobotPose {
  return { bodyRoll: 0, bodyYaw: 0, bodyY: 0, bodyX: 0, headYaw: 0, headTilt: 0, headPitch: 0, leftArm: 0, rightArm: 0, eyeOpen: 1, gazeX: 0, gazeY: 0, expression: "smile", expressionFrom: "smile", expressionMix: 1 };
}

export function createRobotAnimator(random: () => number = Math.random): RobotAnimator {
  return {
    pose: createPose(), target: createPose(), random,
    state: "greeting", elapsed: 0, duration: STARTUP_DURATIONS[0], time: 0,
    startupPhase: 0, yawBase: 0, spinDirection: 1, direction: 1,
    lookDirection: 0, lastAction: "idle", nextBlink: 3.4, blinkElapsed: -1,
  };
}

function expressionFor(state: RobotState): RobotExpression {
  switch (state) {
    case "dizzy": case "fall": return "dizzy";
    case "down": case "recover": case "stumble": return "confused";
    case "cry": case "angry": case "sleepy": return state;
    case "idle": case "look": case "tilt": return "neutral";
    default: return "smile";
  }
}

function enter(animator: RobotAnimator, state: RobotState, duration: number) {
  animator.state = state;
  animator.elapsed = 0;
  animator.duration = duration;
  animator.direction = animator.random() < 0.5 ? -1 : 1;
  animator.lookDirection = Math.floor(sample(animator, 0, 2.999)) - 1;
  if (state === "spin") {
    // End at 0 or ±one turn, then return on the next spin. The Euler angle stays
    // continuous and bounded even if the tab remains open for hours.
    animator.spinDirection = animator.yawBase === 0 ? animator.direction : -Math.sign(animator.yawBase);
  }
  const expression = expressionFor(state);
  if (expression !== animator.pose.expression) {
    animator.pose.expressionFrom = animator.pose.expression;
    animator.pose.expression = expression;
    animator.pose.expressionMix = 0;
  }
}

function chooseAction(animator: RobotAnimator): RobotState {
  const chance = sample(animator, 0, 100);
  let action: RobotState = chance < 23 ? "look" : chance < 37 ? "tilt" : chance < 52 ? "smile" : chance < 64 ? "wave" : chance < 71 ? "spin" : chance < 78 ? "stumble" : chance < 85 ? "cry" : chance < 91 ? "angry" : "sleepy";
  if (action === animator.lastAction) action = action === "look" ? "tilt" : "look";
  animator.lastAction = action;
  return action;
}

function next(animator: RobotAnimator) {
  if (animator.state === "spin") animator.yawBase += animator.spinDirection * TURN;
  if (animator.startupPhase < STARTUP_STATES.length - 1) {
    animator.startupPhase++;
    enter(animator, STARTUP_STATES[animator.startupPhase], STARTUP_DURATIONS[animator.startupPhase]);
    return;
  }
  if (animator.startupPhase < STARTUP_STATES.length) {
    // The scripted blink follows the full two-second hello pause. Ambient
    // blinking starts only after the entire greeting/fall/recovery has finished.
    animator.nextBlink = animator.time + sample(animator, 2.4, 6.2);
  }
  animator.startupPhase = STARTUP_STATES.length;
  if (animator.state === "idle") {
    const action = chooseAction(animator);
    const duration = action === "spin" ? sample(animator, 1.5, 1.95)
      : action === "stumble" ? sample(animator, 1.5, 2)
      : action === "sleepy" ? sample(animator, 3.5, 5)
      : action === "wave" ? sample(animator, 2.2, 3)
      : sample(animator, 2.2, 3.8);
    enter(animator, action, duration);
  } else if (animator.state === "spin") {
    enter(animator, "stumble", 1.7);
  } else {
    enter(animator, "idle", sample(animator, 2.8, 6.8));
  }
}

function setTarget(animator: RobotAnimator) {
  const target = animator.target;
  const time = animator.time;
  const elapsed = animator.elapsed;
  const progress = clamp01(elapsed / animator.duration);
  const weight = envelope(elapsed, animator.duration);
  const direction = animator.direction;

  target.bodyRoll = Math.sin(time * 0.8) * 0.022;
  target.bodyYaw = animator.yawBase;
  target.bodyY = 0.012 + Math.sin(time * 1.8) * 0.012;
  target.bodyX = Math.sin(time * 0.45) * 0.012;
  target.headYaw = Math.sin(time * 0.35) * 0.045;
  target.headTilt = Math.sin(time * 0.65) * 0.035;
  target.headPitch = Math.sin(time * 0.9) * 0.024;
  target.leftArm = -0.035 + Math.sin(time * 1.1) * 0.02;
  target.rightArm = 0.035 - Math.sin(time * 1.1) * 0.02;
  target.eyeOpen = 1;
  target.gazeX = 0;
  target.gazeY = 0;

  switch (animator.state) {
    case "greeting": case "wave": {
      const wave = envelope(elapsed, animator.duration, 0.42);
      target.rightArm = wave * (1.94 + Math.sin(elapsed * 11) * 0.3);
      target.leftArm = -0.12 * wave;
      target.headYaw = 0;
      target.headTilt = -0.1 * wave;
      target.bodyRoll = -0.04 * wave;
      break;
    }
    case "hello-pause":
      target.headYaw = 0;
      target.headTilt = 0.04;
      break;
    case "blink":
      target.eyeOpen = 1 - Math.sin(Math.PI * progress) ** 2;
      break;
    case "spin":
      target.bodyYaw = animator.yawBase + animator.spinDirection * TURN * smooth(progress);
      target.bodyY += Math.sin(Math.PI * progress) ** 2 * 0.09;
      target.leftArm = -0.5 * weight;
      target.rightArm = 0.5 * weight;
      target.headYaw = 0;
      target.headTilt = 0;
      break;
    case "dizzy":
      target.bodyRoll = Math.sin(elapsed * 10) * (0.06 + 0.11 * progress);
      target.headTilt = Math.sin(elapsed * 8 + 0.7) * 0.18;
      target.headYaw = Math.sin(elapsed * 6) * 0.12;
      target.leftArm = -0.55;
      target.rightArm = 0.55;
      target.gazeX = Math.sin(elapsed * 6) * 0.45;
      target.gazeY = Math.cos(elapsed * 6) * 0.25;
      break;
    case "fall": {
      const fall = smooth(progress);
      target.bodyRoll = FALL_ROLL * fall;
      target.bodyX = -0.12 * fall;
      target.bodyY = 0;
      target.headTilt = 0.15 * fall;
      target.headYaw = 0;
      target.leftArm = -0.9 * fall;
      target.rightArm = 0.95 * fall;
      break;
    }
    case "down":
      target.bodyRoll = FALL_ROLL + Math.sin(elapsed * 3) * 0.012;
      target.bodyX = -0.12;
      target.bodyY = 0;
      target.headTilt = 0.15;
      target.headYaw = Math.sin(elapsed * 2) * 0.09;
      target.leftArm = -0.9;
      target.rightArm = 0.95;
      target.gazeX = Math.sin(elapsed * 3) * 0.35;
      target.gazeY = 0.12;
      target.eyeOpen = 0.85;
      break;
    case "recover": {
      const remaining = 1 - smooth(progress);
      target.bodyRoll = FALL_ROLL * remaining;
      target.bodyX = -0.12 * remaining;
      target.bodyY = 0;
      target.headTilt = 0.15 * remaining;
      target.headPitch = 0.15 * Math.sin(Math.PI * progress);
      target.headYaw = 0;
      target.leftArm = -0.9 * remaining;
      target.rightArm = 0.95 * remaining;
      break;
    }
    case "look":
      target.headYaw = animator.lookDirection * 0.48 * weight;
      target.gazeX = animator.lookDirection * 0.4 * weight;
      break;
    case "tilt":
      target.headTilt = direction * 0.25 * weight;
      target.bodyRoll = -direction * 0.035 * weight;
      target.gazeY = 0.15 * weight;
      break;
    case "smile":
      target.headTilt = direction * 0.1 * weight;
      target.eyeOpen = 1 - 0.15 * weight;
      break;
    case "cry":
      target.headPitch = 0.18 * weight;
      target.headTilt = direction * 0.08 * weight;
      target.leftArm = -0.15 * weight;
      target.rightArm = 0.15 * weight;
      target.gazeY = -0.2 * weight;
      break;
    case "angry":
      target.headPitch = 0.12 * weight;
      target.headYaw = direction * 0.06 * weight;
      target.leftArm = -0.26 * weight;
      target.rightArm = 0.26 * weight;
      target.eyeOpen = 1 - 0.32 * weight;
      break;
    case "sleepy":
      target.headPitch = 0.32 * weight;
      target.headTilt = direction * 0.16 * weight;
      target.eyeOpen = 1 - 0.82 * weight;
      target.bodyY *= 0.4;
      break;
    case "stumble":
      target.bodyRoll = direction * Math.sin(progress * Math.PI * 4) * 0.22 * weight;
      target.bodyX = direction * Math.sin(progress * Math.PI * 2) * 0.07 * weight;
      target.headTilt = -target.bodyRoll * 0.5;
      target.leftArm = -0.45 * weight;
      target.rightArm = 0.45 * weight;
      break;
  }

  if (animator.blinkElapsed >= 0 && animator.state !== "blink" && animator.state !== "fall") {
    target.eyeOpen *= 1 - Math.sin(Math.PI * clamp01(animator.blinkElapsed / 0.18)) ** 2;
  }
  target.eyeOpen = Math.max(0.035, target.eyeOpen);
}

/** Advance only while visible, in motion mode, and not scrolling. No frame allocations. */
export function stepRobotAnimator(animator: RobotAnimator, deltaSeconds: number): RobotPose {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return animator.pose;
  // A backgrounded or stalled frame must never skip the greeting or recovery.
  const delta = Math.min(deltaSeconds, 0.1);
  animator.time += delta;
  animator.elapsed += delta;
  if (animator.elapsed >= animator.duration) {
    const remainder = animator.elapsed - animator.duration;
    next(animator);
    animator.elapsed = remainder;
  }
  if (animator.blinkElapsed >= 0) {
    animator.blinkElapsed += delta;
    if (animator.blinkElapsed >= 0.18) {
      animator.blinkElapsed = -1;
      animator.nextBlink = animator.time + sample(animator, 2.4, 6.2);
    }
  } else if (animator.startupPhase >= STARTUP_STATES.length && animator.time >= animator.nextBlink) {
    animator.blinkElapsed = 0;
  }

  setTarget(animator);
  const pose = animator.pose;
  const target = animator.target;
  const bodyBlend = 1 - Math.exp(-13 * delta);
  const headBlend = 1 - Math.exp(-10 * delta);
  const eyelidBlend = 1 - Math.exp(-48 * delta);
  for (const key of POSE_KEYS) {
    const blend = key === "eyeOpen" ? eyelidBlend : key.startsWith("head") || key.startsWith("gaze") ? headBlend : bodyBlend;
    pose[key] += (target[key] - pose[key]) * blend;
  }
  pose.expressionMix = Math.min(1, pose.expressionMix + delta / 0.32);
  return pose;
}

/** Reduced motion uses a quiet upright smile, including when toggled mid-fall. */
export function settleRobotAnimator(animator: RobotAnimator): RobotPose {
  animator.startupPhase = STARTUP_STATES.length;
  animator.yawBase = 0;
  animator.blinkElapsed = -1;
  animator.nextBlink = animator.time + sample(animator, 2.4, 6.2);
  enter(animator, "idle", sample(animator, 2.8, 6.8));
  for (const key of POSE_KEYS) animator.pose[key] = animator.target[key] = key === "eyeOpen" ? 1 : 0;
  animator.pose.expression = animator.pose.expressionFrom = "smile";
  animator.pose.expressionMix = 1;
  return animator.pose;
}

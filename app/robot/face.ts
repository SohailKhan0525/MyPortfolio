import {
  Box3,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Shape,
  ShapeGeometry,
  Sphere,
  Vector3,
} from "three";
import type { RobotPose } from "./behavior";

type Expression = RobotPose["expression"];
type Features = {
  leftWidth: number; rightWidth: number; leftHeight: number; rightHeight: number;
  leftTilt: number; rightTilt: number; leftBrow: number; rightBrow: number;
  browLift: number; brows: number; mouthWidth: number; mouthCurve: number;
  mouthY: number; mouthSlant: number; mouthOpen: number;
  tears: number; dizzy: number; warmth: number; sparkle: number;
};

const NEUTRAL: Features = {
  leftWidth: 0.078, rightWidth: 0.078, leftHeight: 0.112, rightHeight: 0.112,
  leftTilt: 0, rightTilt: 0, leftBrow: 0, rightBrow: 0,
  browLift: 0, brows: 0, mouthWidth: 0.112, mouthCurve: 0.034,
  mouthY: -0.13, mouthSlant: 0, mouthOpen: 0,
  tears: 0, dizzy: 0, warmth: 0, sparkle: 1,
};
const FACES: Record<Expression, Features> = {
  neutral: NEUTRAL,
  smile: { ...NEUTRAL, leftWidth: 0.084, rightWidth: 0.084, leftHeight: 0.102,
    rightHeight: 0.102, leftTilt: -0.025, rightTilt: 0.025,
    mouthWidth: 0.132, mouthCurve: 0.068, mouthY: -0.115 },
  cry: { ...NEUTRAL, leftHeight: 0.092, rightHeight: 0.092,
    leftTilt: 0.10, rightTilt: -0.10, leftBrow: 0.28, rightBrow: -0.28,
    brows: 1, mouthWidth: 0.098, mouthCurve: -0.047, mouthY: -0.195, tears: 1, sparkle: 0.7 },
  angry: { ...NEUTRAL, leftWidth: 0.088, rightWidth: 0.088, leftHeight: 0.078,
    rightHeight: 0.078, leftTilt: -0.18, rightTilt: 0.18,
    leftBrow: -0.34, rightBrow: 0.34, browLift: -0.015, brows: 1,
    mouthWidth: 0.087, mouthCurve: -0.008, mouthY: -0.16, warmth: 0.65, sparkle: 0.45 },
  sleepy: { ...NEUTRAL, leftWidth: 0.086, rightWidth: 0.086,
    leftHeight: 0.09, rightHeight: 0.09, leftTilt: 0.03, rightTilt: -0.03,
    mouthY: -0.15, mouthOpen: 1, sparkle: 0.15 },
  dizzy: { ...NEUTRAL, dizzy: 1, mouthWidth: 0.105, mouthCurve: 0,
    mouthY: -0.15, sparkle: 0 },
  confused: { ...NEUTRAL, leftHeight: 0.118, rightHeight: 0.08,
    rightTilt: -0.06, leftBrow: 0.04, rightBrow: 0.18,
    browLift: 0.015, brows: 0.85, mouthWidth: 0.086, mouthCurve: 0.008,
    mouthY: -0.15, mouthSlant: 0.018 },
};
const FEATURE_KEYS = Object.keys(NEUTRAL) as (keyof Features)[];
const MINT = new Color("#8af4df");
const WARM = new Color("#f5c5a8");
const EYE_SEGMENTS = 64;
const MOUTH_SEGMENTS = 28;
const CAP_SEGMENTS = 10;

function boundedGeometry(positions: Float32Array, indices: number[]) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  geometry.setIndex(indices);
  // All changing contours stay inside this local envelope. No per-frame scans.
  geometry.boundingBox = new Box3(new Vector3(-0.4, -0.25, 0), new Vector3(0.4, 0.36, 0));
  geometry.boundingSphere = new Sphere(new Vector3(), 0.55);
  return geometry;
}

function createEye() {
  const positions = new Float32Array((EYE_SEGMENTS + 1) * 3);
  const indices: number[] = [];
  for (let i = 0; i < EYE_SEGMENTS; i++) indices.push(0, i + 1, (i + 1) % EYE_SEGMENTS + 1);
  const geometry = boundedGeometry(positions, indices);
  const attribute = geometry.getAttribute("position") as Float32BufferAttribute;
  return {
    geometry,
    update(width: number, height: number, dizzy: number) {
      for (let i = 0; i < EYE_SEGMENTS; i++) {
        const angle = i / EYE_SEGMENTS * Math.PI * 2;
        // A rounded X is a single filled, star-shaped contour, not crossed
        // transparent strokes. Its winding stays front-facing while morphing.
        const crossRadius = 0.026 + 0.084 * Math.sin(angle * 2) ** 6;
        const x = Math.cos(angle) * (width * (1 - dizzy) + crossRadius * dizzy);
        const y = Math.sin(angle) * (height * (1 - dizzy) + crossRadius * dizzy);
        attribute.setXYZ(i + 1, x, y, 0);
      }
      attribute.needsUpdate = true;
    },
  };
}

/** One nonoverlapping ribbon and two half-disc end caps; no stacked discs. */
function createMouth() {
  const stripVertices = (MOUTH_SEGMENTS + 1) * 2;
  const capVertices = CAP_SEGMENTS + 2;
  const positions = new Float32Array((stripVertices + capVertices * 2) * 3);
  const indices: number[] = [];
  for (let i = 0; i < MOUTH_SEGMENTS; i++) {
    const index = i * 2;
    indices.push(index, index + 1, index + 2, index + 2, index + 1, index + 3);
  }
  for (let end = 0; end < 2; end++) {
    const start = stripVertices + end * capVertices;
    for (let i = 0; i < CAP_SEGMENTS; i++) indices.push(start, start + i + 1, start + i + 2);
  }
  const geometry = boundedGeometry(positions, indices);
  const attribute = geometry.getAttribute("position") as Float32BufferAttribute;
  return {
    geometry,
    update(width: number, curve: number, slant: number, dizzy: number) {
      const radius = 0.0135;
      for (let i = 0; i <= MOUTH_SEGMENTS; i++) {
        const t = i / MOUTH_SEGMENTS;
        const x = (2 * t - 1) * width;
        const y = curve * (4 * (t - 0.5) ** 2 - 1) + (2 * t - 1) * slant
          + dizzy * 0.018 * Math.sin(t * Math.PI * 4);
        const dx = 2 * width;
        const dy = 8 * curve * (t - 0.5) + 2 * slant + dizzy * 0.018 * Math.PI * 4 * Math.cos(t * Math.PI * 4);
        const inverseLength = 1 / Math.hypot(dx, dy);
        const tx = dx * inverseLength;
        const ty = dy * inverseLength;
        const nx = -ty;
        const ny = tx;
        attribute.setXYZ(i * 2, x + nx * radius, y + ny * radius, 0);
        attribute.setXYZ(i * 2 + 1, x - nx * radius, y - ny * radius, 0);
        if (i === 0 || i === MOUTH_SEGMENTS) {
          const end = i === 0 ? 0 : 1;
          const start = stripVertices + end * capVertices;
          const direction = end === 0 ? 1 : -1;
          attribute.setXYZ(start, x, y, 0);
          for (let cap = 0; cap <= CAP_SEGMENTS; cap++) {
            const angle = cap / CAP_SEGMENTS * Math.PI;
            attribute.setXYZ(start + cap + 1,
              x + radius * direction * (nx * Math.cos(angle) - tx * Math.sin(angle)),
              y + radius * direction * (ny * Math.cos(angle) - ty * Math.sin(angle)), 0);
          }
        }
      }
      attribute.needsUpdate = true;
    },
  };
}

function capsuleShape(width: number, height: number) {
  const shape = new Shape();
  const r = height / 2;
  const x = width / 2 - r;
  shape.moveTo(-x, -r);
  shape.lineTo(x, -r);
  shape.absarc(x, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-x, r);
  shape.absarc(-x, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return new ShapeGeometry(shape, 12);
}

function tearShape() {
  const shape = new Shape();
  shape.moveTo(0, 0.055);
  shape.bezierCurveTo(-0.012, 0.027, -0.043, -0.016, 0, -0.031);
  shape.bezierCurveTo(0.043, -0.016, 0.012, 0.027, 0, 0.055);
  return new ShapeGeometry(shape, 18);
}

/** A single morphing face, with clear filled eyes and independently readable cues. */
export function createRobotFace() {
  const root = new Group();
  root.name = "Minty expression display";
  const eyes = new Group();
  eyes.name = "Minty eyes";
  eyes.position.y = 0.13;
  const brows = new Group();
  brows.name = "Minty brows";
  const mouthGroup = new Group();
  mouthGroup.name = "Minty mouth";
  const tears = new Group();
  tears.name = "Minty tears";
  root.add(eyes, brows, mouthGroup, tears);

  const ink = new MeshBasicMaterial({ color: MINT, depthWrite: false, toneMapped: false });
  const mouthInk = new MeshBasicMaterial({ color: MINT, depthWrite: false, toneMapped: false, transparent: true });
  const openInk = mouthInk.clone();
  const shine = new MeshBasicMaterial({ color: "#f5fff9", depthWrite: false, toneMapped: false, transparent: true });
  const tearInk = new MeshBasicMaterial({ color: "#80cfff", depthWrite: false, toneMapped: false, transparent: true });
  const eyeShapes = [createEye(), createEye()];
  const mouth = createMouth();
  const catchlightGeometry = capsuleShape(0.035, 0.025);
  const browGeometry = capsuleShape(0.17, 0.024);
  const tearsGeometry = tearShape();
  const yawnGeometry = new RingGeometry(0.65, 1, 40);
  const eyeGroups: Group[] = [];
  const eyebrowMeshes: Mesh[] = [];
  const highlights: Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    const eye = new Group();
    eye.name = i === 0 ? "Minty left eye" : "Minty right eye";
    eye.position.x = side * 0.225;
    eye.add(new Mesh(eyeShapes[i].geometry, ink));
    const highlight = new Mesh(catchlightGeometry, shine);
    highlight.position.set(-0.022, 0.038, 0.004);
    eye.add(highlight);
    eyes.add(eye);
    eyeGroups.push(eye);
    highlights.push(highlight);
    const brow = new Mesh(browGeometry, ink);
    brow.position.set(side * 0.225, 0.305, 0.002);
    brows.add(brow);
    eyebrowMeshes.push(brow);
    const tear = new Mesh(tearsGeometry, tearInk);
    tear.position.set(side * 0.282, i === 0 ? -0.025 : -0.075, 0.003);
    tears.add(tear);
  }
  const smile = new Mesh(mouth.geometry, mouthInk);
  const yawn = new Mesh(yawnGeometry, openInk);
  yawn.position.z = 0.003;
  yawn.scale.set(0.045, 0.063, 1);
  mouthGroup.add(smile, yawn);
  const current: Features = { ...NEUTRAL };
  let lastFrom: Expression | undefined;
  let lastExpression: Expression | undefined;
  let lastMix = -1;

  return {
    root,
    applyPose(pose: RobotPose) {
      const linearMix = Math.max(0, Math.min(1, pose.expressionMix));
      const mix = linearMix * linearMix * (3 - 2 * linearMix);
      if (lastFrom !== pose.expressionFrom || lastExpression !== pose.expression || lastMix !== mix) {
        const from = FACES[pose.expressionFrom];
        const to = FACES[pose.expression];
        for (const key of FEATURE_KEYS) current[key] = from[key] + (to[key] - from[key]) * mix;
        eyeShapes[0].update(current.leftWidth, current.leftHeight, current.dizzy);
        eyeShapes[1].update(current.rightWidth, current.rightHeight, current.dizzy);
        mouth.update(current.mouthWidth, current.mouthCurve, current.mouthSlant, current.dizzy);
        ink.color.lerpColors(MINT, WARM, current.warmth);
        mouthInk.color.copy(ink.color);
        openInk.color.copy(ink.color);
        eyebrowMeshes[0].rotation.z = current.leftBrow;
        eyebrowMeshes[1].rotation.z = current.rightBrow;
        brows.visible = current.brows > 0.01;
        brows.scale.y = Math.max(0.01, current.brows);
        // Keep each brow's center above its own eye while scaling only thickness.
        for (const brow of eyebrowMeshes) brow.position.y = (0.305 + current.browLift) / brows.scale.y;
        tears.visible = current.tears > 0.01;
        tearInk.opacity = current.tears;
        mouthGroup.position.y = current.mouthY;
        smile.scale.x = 1 - current.mouthOpen * 0.7;
        smile.visible = current.mouthOpen < 0.999;
        mouthInk.opacity = 1 - current.mouthOpen;
        yawn.visible = current.mouthOpen > 0.001;
        openInk.opacity = current.mouthOpen;
        lastFrom = pose.expressionFrom;
        lastExpression = pose.expression;
        lastMix = mix;
      }
      const blink = Math.max(0.055, Math.min(1, pose.eyeOpen));
      eyes.scale.y = blink;
      eyes.position.x = pose.gazeX * 0.038;
      eyes.position.y = 0.13 + pose.gazeY * 0.028;
      eyeGroups[0].rotation.z = current.leftTilt;
      eyeGroups[1].rotation.z = current.rightTilt;
      shine.opacity = current.sparkle * Math.max(0, (blink - 0.35) / 0.65);
      highlights[0].visible = highlights[1].visible = shine.opacity > 0.005;
    },
    dispose() {
      for (const eye of eyeShapes) eye.geometry.dispose();
      mouth.geometry.dispose();
      catchlightGeometry.dispose();
      browGeometry.dispose();
      tearsGeometry.dispose();
      yawnGeometry.dispose();
      ink.dispose();
      mouthInk.dispose();
      openInk.dispose();
      shine.dispose();
      tearInk.dispose();
    },
  };
}

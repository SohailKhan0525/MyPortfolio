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
  leftCurve: number; rightCurve: number; leftTilt: number; rightTilt: number;
  leftBrow: number; rightBrow: number; browLift: number; brows: number;
  mouthWidth: number; mouthCurve: number; mouthY: number; mouthSlant: number;
  mouthOpen: number; tears: number; dizzy: number; warmth: number; sparkle: number; blush: number;
};

// Shape, rather than color alone, carries each emotion at the companion's small
// display size. Broad eye silhouettes and a 2px-equivalent mouth survive phones.
const NEUTRAL: Features = {
  leftWidth: 0.105, rightWidth: 0.105, leftHeight: 0.14, rightHeight: 0.14,
  leftCurve: 0, rightCurve: 0, leftTilt: 0, rightTilt: 0,
  leftBrow: 0, rightBrow: 0, browLift: 0, brows: 0,
  mouthWidth: 0.12, mouthCurve: 0.04, mouthY: -0.16, mouthSlant: 0,
  mouthOpen: 0, tears: 0, dizzy: 0, warmth: 0, sparkle: 1, blush: 0.12,
};
const FACES: Record<Expression, Features> = {
  neutral: NEUTRAL,
  smile: { ...NEUTRAL, leftWidth: 0.12, rightWidth: 0.12,
    leftHeight: 0.027, rightHeight: 0.027, leftCurve: 0.085, rightCurve: 0.085,
    mouthWidth: 0.145, mouthCurve: 0.09, mouthY: -0.115, sparkle: 0, blush: 0.85 },
  cry: { ...NEUTRAL, leftWidth: 0.11, rightWidth: 0.11,
    leftHeight: 0.085, rightHeight: 0.085, leftCurve: -0.018, rightCurve: -0.018,
    leftTilt: 0.16, rightTilt: -0.16, leftBrow: 0.36, rightBrow: -0.36,
    brows: 1, mouthWidth: 0.105, mouthCurve: -0.065, mouthY: -0.23,
    tears: 1, sparkle: 0.5, blush: 0 },
  angry: { ...NEUTRAL, leftWidth: 0.125, rightWidth: 0.125,
    leftHeight: 0.055, rightHeight: 0.055, leftCurve: -0.02, rightCurve: -0.02,
    leftTilt: -0.38, rightTilt: 0.38, leftBrow: -0.38, rightBrow: 0.38,
    browLift: -0.055, brows: 1, mouthWidth: 0.1, mouthCurve: -0.025,
    mouthY: -0.18, warmth: 0.6, sparkle: 0, blush: 0 },
  sleepy: { ...NEUTRAL, leftWidth: 0.115, rightWidth: 0.115,
    leftHeight: 0.023, rightHeight: 0.023, leftCurve: -0.045, rightCurve: -0.045,
    leftTilt: 0.06, rightTilt: -0.06, mouthY: -0.16,
    mouthOpen: 1, sparkle: 0, blush: 0 },
  dizzy: { ...NEUTRAL, dizzy: 1, mouthWidth: 0.13, mouthCurve: 0,
    mouthY: -0.18, sparkle: 0, blush: 0 },
  confused: { ...NEUTRAL, leftHeight: 0.15, rightHeight: 0.075,
    rightWidth: 0.1, rightCurve: -0.015, rightTilt: -0.12,
    leftBrow: 0.08, rightBrow: 0.28, browLift: 0.015, brows: 0.9,
    mouthWidth: 0.095, mouthCurve: -0.008, mouthY: -0.18, mouthSlant: 0.04, blush: 0 },
};
const FEATURE_KEYS = Object.keys(NEUTRAL) as (keyof Features)[];
const MINT = new Color("#8af4df");
const WARM = new Color("#f5c5a8");
const EYE_SEGMENTS = 40;
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
  // Two joined ribbons form a filled eye. They can open into an X without
  // triangle fans crossing a concave crescent or duplicate faces fading over it.
  const positions = new Float32Array((EYE_SEGMENTS + 1) * 4 * 3);
  const indices: number[] = [];
  for (let i = 0; i < EYE_SEGMENTS; i++) {
    const a = i * 4;
    for (const offset of [0, 2]) indices.push(a + offset, a + offset + 1, a + offset + 4,
      a + offset + 4, a + offset + 1, a + offset + 5);
  }
  const geometry = boundedGeometry(positions, indices);
  const attribute = geometry.getAttribute("position") as Float32BufferAttribute;
  return {
    geometry,
    update(width: number, height: number, curve: number, dizzy: number) {
      for (let i = 0; i <= EYE_SEGMENTS; i++) {
        const u = 2 * i / EYE_SEGMENTS - 1;
        const rounded = Math.sqrt(Math.max(0, 1 - u ** 4));
        const center = curve * (1 - u * u);
        const top = center + height * rounded;
        const bottom = center - height * rounded;
        const crossCenter = Math.abs(u) * 0.105;
        const crossThickness = 0.029 * Math.sqrt(Math.max(0, 1 - u * u));
        const crossOuter = crossCenter + crossThickness;
        const crossInner = Math.max(0, crossCenter - crossThickness);
        const x = u * (width * (1 - dizzy) + 0.115 * dizzy);
        attribute.setXYZ(i * 4, x, top + (crossOuter - top) * dizzy, 0);
        attribute.setXYZ(i * 4 + 1, x, center + (crossInner - center) * dizzy, 0);
        attribute.setXYZ(i * 4 + 2, x, center + (-crossInner - center) * dizzy, 0);
        attribute.setXYZ(i * 4 + 3, x, bottom + (-crossOuter - bottom) * dizzy, 0);
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
      const radius = 0.021;
      for (let i = 0; i <= MOUTH_SEGMENTS; i++) {
        const t = i / MOUTH_SEGMENTS;
        const x = (2 * t - 1) * width;
        const y = curve * (4 * (t - 0.5) ** 2 - 1) + (2 * t - 1) * slant
          + dizzy * 0.025 * Math.sin(t * Math.PI * 2);
        const dx = 2 * width;
        const dy = 8 * curve * (t - 0.5) + 2 * slant + dizzy * 0.025 * Math.PI * 2 * Math.cos(t * Math.PI * 2);
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
  shape.moveTo(0, 0.065);
  shape.bezierCurveTo(-0.018, 0.025, -0.058, -0.033, 0, -0.05);
  shape.bezierCurveTo(0.058, -0.033, 0.018, 0.025, 0, 0.065);
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
  const cheeks = new Group();
  cheeks.name = "Minty cheeks";
  root.add(eyes, brows, mouthGroup, tears, cheeks);

  const ink = new MeshBasicMaterial({ color: MINT, depthWrite: false, toneMapped: false });
  const mouthInk = new MeshBasicMaterial({ color: MINT, depthWrite: false, toneMapped: false, transparent: true });
  const openInk = mouthInk.clone();
  const shine = new MeshBasicMaterial({ color: "#f5fff9", depthWrite: false, toneMapped: false, transparent: true });
  const tearInk = new MeshBasicMaterial({ color: "#80cfff", depthWrite: false, toneMapped: false, transparent: true });
  const cheekInk = new MeshBasicMaterial({ color: "#eead9e", depthWrite: false, toneMapped: false, transparent: true });
  const eyeShapes = [createEye(), createEye()];
  const mouth = createMouth();
  const catchlightGeometry = capsuleShape(0.035, 0.035);
  const browGeometry = capsuleShape(0.19, 0.032);
  const tearsGeometry = tearShape();
  const cheekGeometry = capsuleShape(0.115, 0.035);
  const yawnGeometry = new RingGeometry(0.48, 1, 32);
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
    highlight.position.set(-0.028, 0.065, 0.004);
    eye.add(highlight);
    eyes.add(eye);
    eyeGroups.push(eye);
    highlights.push(highlight);
    const brow = new Mesh(browGeometry, ink);
    brow.position.set(side * 0.225, 0.335, 0.002);
    brows.add(brow);
    eyebrowMeshes.push(brow);
    const tear = new Mesh(tearsGeometry, tearInk);
    tear.position.set(side * 0.285, i === 0 ? -0.065 : -0.10, 0.003);
    tears.add(tear);
    const cheek = new Mesh(cheekGeometry, cheekInk);
    cheek.position.set(side * 0.325, -0.105, 0.002);
    cheeks.add(cheek);
  }
  const smile = new Mesh(mouth.geometry, mouthInk);
  const yawn = new Mesh(yawnGeometry, openInk);
  yawn.position.z = 0.003;
  yawn.scale.set(0.055, 0.072, 1);
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
        eyeShapes[0].update(current.leftWidth, current.leftHeight, current.leftCurve, current.dizzy);
        eyeShapes[1].update(current.rightWidth, current.rightHeight, current.rightCurve, current.dizzy);
        mouth.update(current.mouthWidth, current.mouthCurve, current.mouthSlant, current.dizzy);
        ink.color.lerpColors(MINT, WARM, current.warmth);
        mouthInk.color.copy(ink.color);
        openInk.color.copy(ink.color);
        eyebrowMeshes[0].rotation.z = current.leftBrow;
        eyebrowMeshes[1].rotation.z = current.rightBrow;
        brows.visible = current.brows > 0.01;
        brows.scale.y = Math.max(0.01, current.brows);
        // Keep each brow's center above its own eye while scaling only thickness.
        for (const brow of eyebrowMeshes) brow.position.y = (0.335 + current.browLift) / brows.scale.y;
        tears.visible = current.tears > 0.01;
        tearInk.opacity = current.tears;
        cheeks.visible = current.blush > 0.01;
        cheekInk.opacity = current.blush;
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
      cheekGeometry.dispose();
      yawnGeometry.dispose();
      ink.dispose();
      mouthInk.dispose();
      openInk.dispose();
      shine.dispose();
      tearInk.dispose();
      cheekInk.dispose();
    },
  };
}

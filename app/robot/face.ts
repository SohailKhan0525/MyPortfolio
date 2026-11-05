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
  pupilWidth: number; pupilHeight: number; pupilY: number;
  mouthWidth: number; mouthCurve: number; mouthY: number; mouthSlant: number;
  mouthOpen: number; tears: number; dizzy: number; warmth: number; sparkle: number; blush: number;
};

// Shape, rather than color alone, carries each emotion at the companion's small
// display size. Broad eye silhouettes and a 2px-equivalent mouth survive phones.
const NEUTRAL: Features = {
  leftWidth: 0.12, rightWidth: 0.12, leftHeight: 0.14, rightHeight: 0.14,
  leftCurve: 0, rightCurve: 0, leftTilt: 0, rightTilt: 0,
  leftBrow: 0, rightBrow: 0, browLift: 0, brows: 0,
  pupilWidth: 0.056, pupilHeight: 0.078, pupilY: 0,
  mouthWidth: 0.12, mouthCurve: 0.04, mouthY: -0.16, mouthSlant: 0,
  mouthOpen: 0, tears: 0, dizzy: 0, warmth: 0, sparkle: 1, blush: 0.12,
};
const FACES: Record<Expression, Features> = {
  neutral: NEUTRAL,
  // A smile keeps eye contact. Closed crescents had hidden the greeting's gaze
  // and made its scripted blink almost indistinguishable from the resting face.
  smile: { ...NEUTRAL, leftWidth: 0.125, rightWidth: 0.125,
    leftHeight: 0.12, rightHeight: 0.12, leftCurve: 0.026, rightCurve: 0.026,
    mouthWidth: 0.14, mouthCurve: 0.075, mouthY: -0.13, sparkle: 0.9, blush: 0.4 },
  cry: { ...NEUTRAL, leftWidth: 0.11, rightWidth: 0.11,
    leftHeight: 0.085, rightHeight: 0.085, leftCurve: -0.018, rightCurve: -0.018,
    leftTilt: 0.16, rightTilt: -0.16, leftBrow: 0.36, rightBrow: -0.36,
    brows: 1, mouthWidth: 0.105, mouthCurve: -0.065, mouthY: -0.23,
    pupilHeight: 0.067, pupilY: -0.025, tears: 1, sparkle: 0.6, blush: 0 },
  angry: { ...NEUTRAL, leftWidth: 0.125, rightWidth: 0.125,
    leftHeight: 0.055, rightHeight: 0.055, leftCurve: -0.02, rightCurve: -0.02,
    leftTilt: -0.38, rightTilt: 0.38, leftBrow: -0.38, rightBrow: 0.38,
    browLift: -0.055, brows: 1, mouthWidth: 0.1, mouthCurve: -0.025,
    mouthY: -0.18, pupilWidth: 0.048, pupilHeight: 0.065,
    warmth: 0.25, sparkle: 0.28, blush: 0 },
  sleepy: { ...NEUTRAL, leftWidth: 0.115, rightWidth: 0.115,
    leftHeight: 0.044, rightHeight: 0.044, leftCurve: -0.025, rightCurve: -0.025,
    leftTilt: 0.06, rightTilt: -0.06, mouthY: -0.16,
    mouthOpen: 1, pupilY: -0.014, sparkle: 0.2, blush: 0 },
  dizzy: { ...NEUTRAL, dizzy: 1, mouthWidth: 0.13, mouthCurve: 0,
    mouthY: -0.18, sparkle: 0, blush: 0 },
  confused: { ...NEUTRAL, leftHeight: 0.15, rightHeight: 0.075,
    rightWidth: 0.1, rightCurve: -0.015, rightTilt: -0.12,
    leftBrow: 0.08, rightBrow: 0.28, browLift: 0.015, brows: 0.9,
    mouthWidth: 0.095, mouthCurve: -0.008, mouthY: -0.18, mouthSlant: 0.04, blush: 0 },
};
const FEATURE_KEYS = Object.keys(NEUTRAL) as (keyof Features)[];
const MINT = new Color("#a3f7df");
const WARM = new Color("#f5c5a8");
const EYE_SEGMENTS = 40;
const PUPIL_SEGMENTS = 32;
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

/** A dark inset pupil stays round while the eyelid closes over it. Its ribbon is
 * clipped to the SAME eye contour before the parent blink scale is applied;
 * no stencil buffer, texture upload or floating pupil mesh is needed. */
function createPupil() {
  const positions = new Float32Array((PUPIL_SEGMENTS + 1) * 4 * 3);
  const indices: number[] = [];
  for (let i = 0; i < PUPIL_SEGMENTS; i++) {
    const a = i * 4;
    for (const offset of [0, 2]) indices.push(a + offset, a + offset + 1, a + offset + 4,
      a + offset + 4, a + offset + 1, a + offset + 5);
  }
  const geometry = boundedGeometry(positions, indices);
  const attribute = geometry.getAttribute("position") as Float32BufferAttribute;
  return {
    geometry,
    update(eyeWidth: number, eyeHeight: number, curve: number, blink: number,
      pupilX: number, pupilY: number, width: number, height: number, dizzy: number) {
      const margin = 0.006;
      const visibleWidth = eyeWidth * (1 - dizzy) + 0.115 * dizzy;
      for (let i = 0; i <= PUPIL_SEGMENTS; i++) {
        const u = 2 * i / PUPIL_SEGMENTS - 1;
        const x = Math.max(-visibleWidth + margin, Math.min(visibleWidth - margin, pupilX + u * width));
        const eyeU = x / visibleWidth;
        const center = curve * (1 - eyeU * eyeU);
        const aperture = eyeHeight * Math.sqrt(Math.max(0, 1 - eyeU ** 4));
        const crossCenter = Math.abs(eyeU) * 0.105;
        const crossThickness = 0.029 * Math.sqrt(Math.max(0, 1 - eyeU * eyeU));
        const crossOuter = crossCenter + crossThickness;
        const crossInner = Math.max(0, crossCenter - crossThickness);
        const pupilExtent = height * Math.sqrt(Math.max(0, 1 - u * u));
        for (let ribbon = 0; ribbon < 2; ribbon++) {
          // Both eye ribbons are honored throughout the X-eye morph, including
          // its opening central gap. Dark pixels never leak outside either lid.
          const upper = ribbon === 0
            ? (center + aperture) * (1 - dizzy) + crossOuter * dizzy
            : center * (1 - dizzy) - crossInner * dizzy;
          const lower = ribbon === 0
            ? center * (1 - dizzy) + crossInner * dizzy
            : (center - aperture) * (1 - dizzy) - crossOuter * dizzy;
          const halfAperture = Math.max(0, (upper - lower) / 2);
          // The internal edges meet exactly in ordinary eyes. Insetting their
          // shared seam would draw an unwanted bright stripe through the iris.
          const upperInset = Math.min(margin * (ribbon === 0 ? 1 : dizzy), halfAperture);
          const lowerInset = Math.min(margin * (ribbon === 0 ? dizzy : 1), halfAperture);
          const top = Math.min(upper - upperInset, (pupilY + pupilExtent) / blink);
          const bottom = Math.max(lower + lowerInset, (pupilY - pupilExtent) / blink);
          const collapsed = Math.max(lower + lowerInset, Math.min(upper - upperInset, pupilY / blink));
          attribute.setXYZ(i * 4 + ribbon * 2, x, top >= bottom ? top : collapsed, 0);
          attribute.setXYZ(i * 4 + ribbon * 2 + 1, x, top >= bottom ? bottom : collapsed, 0);
        }
      }
      attribute.needsUpdate = true;
    },
  };
}

function insideEye(x: number, y: number, width: number, height: number, curve: number) {
  const u = x / width;
  if (Math.abs(u) >= 1) return false;
  return Math.abs(y - curve * (1 - u * u)) < height * Math.sqrt(Math.max(0, 1 - u ** 4)) - 0.006;
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
  const pupilInk = new MeshBasicMaterial({ color: "#153940", depthWrite: false, toneMapped: false, transparent: true });
  const mouthInk = new MeshBasicMaterial({ color: MINT, depthWrite: false, toneMapped: false, transparent: true });
  const openInk = mouthInk.clone();
  const shine = new MeshBasicMaterial({ color: "#f5fff9", depthWrite: false, toneMapped: false, transparent: true });
  const tearInk = new MeshBasicMaterial({ color: "#80cfff", depthWrite: false, toneMapped: false, transparent: true });
  const cheekInk = new MeshBasicMaterial({ color: "#eead9e", depthWrite: false, toneMapped: false, transparent: true });
  const eyeShapes = [createEye(), createEye()];
  const pupilShapes = [createPupil(), createPupil()];
  const mouth = createMouth();
  const catchlightGeometry = capsuleShape(0.029, 0.029);
  const browGeometry = capsuleShape(0.19, 0.032);
  const tearsGeometry = tearShape();
  const cheekGeometry = capsuleShape(0.115, 0.035);
  const yawnGeometry = new RingGeometry(0.48, 1, 32);
  const eyeGroups: Group[] = [];
  const eyebrowMeshes: Mesh[] = [];
  const highlights: Mesh[] = [];
  const pupils: Mesh[] = [];
  const tearMaterials = [tearInk, tearInk.clone()];
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    const eye = new Group();
    eye.name = i === 0 ? "Minty left eye" : "Minty right eye";
    eye.position.x = side * 0.225;
    eye.add(new Mesh(eyeShapes[i].geometry, ink));
    const highlight = new Mesh(catchlightGeometry, shine);
    highlight.name = i === 0 ? "Minty left catchlight" : "Minty right catchlight";
    highlight.position.set(-0.018, 0.033, 0.007);
    highlight.renderOrder = 2;
    // Keep the established first-eye / second-catchlight hierarchy. Explicit
    // transparent layers prevent center-depth sorting from hiding a glint
    // behind its pupil when the head turns. Depth testing still hides the face
    // correctly behind the shell during a full spin.
    eye.add(highlight);
    const pupil = new Mesh(pupilShapes[i].geometry, pupilInk);
    pupil.name = i === 0 ? "Minty left pupil" : "Minty right pupil";
    pupil.position.z = 0.004;
    pupil.renderOrder = 1;
    eye.add(pupil);
    pupils.push(pupil);
    eyes.add(eye);
    eyeGroups.push(eye);
    highlights.push(highlight);
    const brow = new Mesh(browGeometry, ink);
    brow.position.set(side * 0.225, 0.335, 0.002);
    brows.add(brow);
    eyebrowMeshes.push(brow);
    const tear = new Mesh(tearsGeometry, tearMaterials[i]);
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
        cheeks.visible = current.blush > 0.01;
        cheekInk.opacity = current.blush;
        lastFrom = pose.expressionFrom;
        lastExpression = pose.expression;
        lastMix = mix;
      }
      const blink = Math.max(0.055, Math.min(1, pose.eyeOpen));
      const time = Number.isFinite(pose.faceTime) ? pose.faceTime : 0;
      const intensity = Math.max(0, Math.min(1, pose.expressionIntensity ?? 1));
      eyes.scale.y = blink;
      // Iris movement makes an intentional look readable before the head turns.
      // A much smaller movement of the eye itself keeps it seated in the visor.
      eyes.position.x = pose.gazeX * 0.012;
      eyes.position.y = 0.13 + pose.gazeY * 0.008;
      eyeGroups[0].rotation.z = current.leftTilt;
      eyeGroups[1].rotation.z = current.rightTilt;
      shine.opacity = current.sparkle * Math.max(0, (blink - 0.35) / 0.65);
      pupilInk.opacity = 1 - current.dizzy;
      const pupilX = Math.max(-1, Math.min(1, pose.gazeX)) * 0.046;
      const pupilY = current.pupilY + Math.max(-1, Math.min(1, pose.gazeY)) * 0.035;
      for (let i = 0; i < 2; i++) {
        const width = i === 0 ? current.leftWidth : current.rightWidth;
        const height = i === 0 ? current.leftHeight : current.rightHeight;
        const curve = i === 0 ? current.leftCurve : current.rightCurve;
        pupils[i].visible = blink > 0.18 && current.dizzy < 0.98;
        pupilShapes[i].update(width, height, curve, blink, pupilX, pupilY,
          current.pupilWidth, current.pupilHeight, current.dizzy);
        const highlightX = pupilX - 0.018;
        const highlightY = (pupilY + 0.033) / blink;
        const radiusX = 0.0145;
        const radiusY = radiusX / blink;
        highlights[i].position.set(highlightX, highlightY, 0.007);
        highlights[i].scale.y = 1 / blink;
        // Full glints only: a sliver left hanging outside a closed lid looks like
        // a second pupil, especially at the mobile companion's actual size.
        highlights[i].visible = pupils[i].visible && shine.opacity > 0.005 && current.dizzy < 0.001
          && insideEye(highlightX - radiusX, highlightY - radiusY, width, height, curve)
          && insideEye(highlightX - radiusX, highlightY + radiusY, width, height, curve)
          && insideEye(highlightX + radiusX, highlightY - radiusY, width, height, curve)
          && insideEye(highlightX + radiusX, highlightY + radiusY, width, height, curve);
      }
      const mouthOpen = current.mouthOpen * intensity;
      mouthGroup.position.y = current.mouthY + Math.sin(time * 8) * current.tears * intensity * 0.004;
      mouthGroup.rotation.z = Math.sin(time * 6.5) * current.tears * intensity * 0.035;
      smile.scale.x = 1 - mouthOpen * 0.7;
      smile.visible = mouthOpen < 0.999;
      mouthInk.opacity = 1 - mouthOpen;
      yawn.visible = mouthOpen > 0.001;
      yawn.scale.set(0.04 + mouthOpen * 0.015, 0.025 + mouthOpen * 0.047, 1);
      openInk.opacity = mouthOpen;
      for (let i = 0; i < tears.children.length; i++) {
        const drop = tears.children[i];
        const travel = (time * 0.72 + i * 0.46) % 1;
        drop.position.y = -0.035 - travel * 0.18;
        drop.scale.setScalar(0.55 + Math.sin(Math.PI * travel) * 0.3);
        tearMaterials[i].opacity = current.tears * intensity * Math.sin(Math.PI * travel);
      }
    },
    dispose() {
      for (const eye of eyeShapes) eye.geometry.dispose();
      for (const pupil of pupilShapes) pupil.geometry.dispose();
      mouth.geometry.dispose();
      catchlightGeometry.dispose();
      browGeometry.dispose();
      tearsGeometry.dispose();
      cheekGeometry.dispose();
      yawnGeometry.dispose();
      ink.dispose();
      pupilInk.dispose();
      mouthInk.dispose();
      openInk.dispose();
      shine.dispose();
      for (const material of tearMaterials) material.dispose();
      cheekInk.dispose();
    },
  };
}

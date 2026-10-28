import {
  BufferGeometry,
  Group,
  Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import type { RobotPose } from "./behavior";
import { createRobotFace } from "./face";

const SCALE = 2.4 / 149.8;
const BODY_PIVOT = new Vector3(0, 8.2 * SCALE, 0);
const HEAD_PIVOT = new Vector3(0, 80.4 * SCALE, 0);
const LEFT_PIVOT = new Vector3(-39.3 * SCALE, 67.2 * SCALE, 4 * SCALE);
const RIGHT_PIVOT = new Vector3(39.3 * SCALE, 67.2 * SCALE, 4 * SCALE);
const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const HEAD_NAMES = [
  "Oversized soft-square head", "Rear mint backpack", "Left head swivel", "Left swivel cover",
  "Left swivel detail", "Right head swivel", "Right swivel cover", "Right swivel detail",
  "Top touch sensor / mint cap", "Graphite visor seal", "Deep glossy curved screen", "Visor upper reflection",
].map(normalizeName);
const BASE_NAMES = ["Charging plinth / warm white", "Inset base top", "Lower mint edge trim", "Power indicator"].map(normalizeName);
const LEFT_NAMES = ["Left waving soft paddle arm", "Left mint wing inset"].map(normalizeName);
const RIGHT_NAMES = ["Right rounded hanging paddle arm", "Right mint wing trim"].map(normalizeName);

function isFaceFeature(name: string) {
  return name.includes("eye") || name.startsWith("smilesegment") || name.includes("cheekled");
}

function supportPoints(part: Group): Vector3[] {
  const directions = [new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 1, 0),
    new Vector3(0, -1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)];
  for (let i = 0; i < 48; i++) {
    const y = 1 - 2 * (i + 0.5) / 48;
    const radius = Math.sqrt(1 - y * y);
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    directions.push(new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
  }
  const result = new Map<string, Vector3>();
  // A small sampled convex support hull avoids imaginary corners beneath the
  // tapered shell. Vertex scans happen once during setup, never during animation.
  for (const direction of directions) {
    let greatest = -Infinity;
    const point = new Vector3();
    for (const mesh of part.children) {
      if (!(mesh instanceof Mesh)) continue;
      const positions = mesh.geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + mesh.position.x;
        const y = positions.getY(i) + mesh.position.y;
        const z = positions.getZ(i) + mesh.position.z;
        const dot = x * direction.x + y * direction.y + z * direction.z;
        if (dot > greatest) { greatest = dot; point.set(x, y, z); }
      }
    }
    if (greatest !== -Infinity) result.set(point.toArray().join(","), point);
  }
  return [...result.values()];
}

/** Rigs the supplied static GLB; shared loader resources are never modified/disposed. */
export function createRobotRig(source: Group) {
  const root = new Group();
  root.name = "Minty robot";
  const body = new Group();
  body.name = "Minty body pivot";
  body.position.copy(BODY_PIVOT);
  const head = new Group();
  head.name = "Minty neck pivot";
  head.position.copy(HEAD_PIVOT).sub(BODY_PIVOT);
  const leftArm = new Group();
  leftArm.name = "Minty left shoulder";
  leftArm.position.copy(LEFT_PIVOT).sub(BODY_PIVOT);
  const rightArm = new Group();
  rightArm.name = "Minty right shoulder";
  rightArm.position.copy(RIGHT_PIVOT).sub(BODY_PIVOT);
  root.add(body);
  body.add(head, leftArm, rightArm);

  const sourceClone = source.clone(true);
  sourceClone.updateMatrixWorld(true);
  const normalization = new Matrix4().makeRotationX(-Math.PI / 2).multiply(new Matrix4().makeScale(SCALE, SCALE, SCALE));
  const geometries: BufferGeometry[] = [];
  const materialCopies = new Map<Material, Material>();
  const cloneMaterial = (sourceMaterial: Material) => {
    let material = materialCopies.get(sourceMaterial);
    if (!material) {
      material = sourceMaterial.clone();
      if (material instanceof MeshStandardMaterial) {
        material.flatShading = false;
        // Keep the actual model's mint/white materials and quiet emissive LEDs.
        material.emissiveIntensity = Math.min(material.emissiveIntensity, 0.65);
      }
      materialCopies.set(sourceMaterial, material);
    }
    return material;
  };
  sourceClone.traverse((object: Object3D) => {
    if (!(object instanceof Mesh)) return;
    const name = normalizeName(object.name);
    // Replace the face drawing and fixed brow-like reflection; retain the curved screen.
    if (isFaceFeature(name) || name === "visorupperreflection") return;
    let parent = body;
    let pivot = BODY_PIVOT;
    if (BASE_NAMES.includes(name)) { parent = root; pivot = new Vector3(); }
    else if (HEAD_NAMES.includes(name)) { parent = head; pivot = HEAD_PIVOT; }
    else if (LEFT_NAMES.includes(name)) { parent = leftArm; pivot = LEFT_PIVOT; }
    else if (RIGHT_NAMES.includes(name)) { parent = rightArm; pivot = RIGHT_PIVOT; }

    const geometry = object.geometry.clone();
    geometry.applyMatrix4(new Matrix4().multiplyMatrices(normalization, object.matrixWorld));
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometries.push(geometry);
    const material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
    const mesh = new Mesh(geometry, material);
    mesh.name = object.name;
    mesh.position.copy(pivot).negate();
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
  });

  const face = createRobotFace();
  face.root.position.set(0, (113 - 80.4) * SCALE, 35.6 * SCALE);
  head.add(face.root);
  const supports = [body, head, leftArm, rightArm].map((part) => ({ part, points: supportPoints(part) }));
  const supportPoint = new Vector3();

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    face: face.root,
    applyPose(pose: RobotPose) {
      // The original left paddle is raised. Rotate it into a relaxed shoulder pose
      // first, then apply the same autonomous arm offsets as the right shoulder.
      const armRest = 2.55 + pose.leftArm;
      const tuckProgress = Math.max(0, Math.min(1, (pose.bodyRoll - 0.12) / 0.65));
      const tuck = tuckProgress * tuckProgress * (3 - 2 * tuckProgress);
      // As the robot lands on its left side, its lower paddle folds across its
      // body instead of propping the entire head in the air like a rigid leg.
      leftArm.rotation.set(-0.65 * tuck, 0, armRest + (3.6 - armRest) * tuck);
      rightArm.rotation.z = pose.rightArm;
      head.rotation.set(pose.headPitch, pose.headYaw, pose.headTilt, "YXZ");
      body.rotation.set(0, pose.bodyYaw, pose.bodyRoll, "YXZ");
      body.position.set(pose.bodyX + Math.sin(pose.bodyRoll) * 0.7, BODY_PIVOT.y + pose.bodyY, 0);
      face.applyPose(pose);
      root.updateMatrixWorld(true);

      // At most 216 precomputed support points; no vertex scans/DOM measurements.
      // Raise a falling body just enough for its shell/arms to meet the floor.
      let minimumY = Infinity;
      for (const { part, points } of supports) {
        for (const point of points) {
          supportPoint.copy(point).applyMatrix4(part.matrixWorld);
          minimumY = Math.min(minimumY, supportPoint.y);
        }
      }
      if (minimumY < 0.025) body.position.y += 0.025 - minimumY;
      root.updateMatrixWorld(true);
    },
    dispose() {
      face.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materialCopies.values()) material.dispose();
    },
  };
}

export type RobotRig = ReturnType<typeof createRobotRig>;

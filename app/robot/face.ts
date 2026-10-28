import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
} from "three";
import type { RobotPose } from "./behavior";

type Expression = RobotPose["expression"];
type Point = readonly [number, number];

const EXPRESSIONS: Expression[] = [
  "neutral", "smile", "cry", "angry", "sleepy", "dizzy", "confused",
];

/** Small unlit, rounded mesh strokes: no DOM/canvas texture or per-frame uploads. */
function strokes(paths: Point[][], width: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const radius = width / 2;
  const disc = (x: number, y: number) => {
    const start = positions.length / 3;
    positions.push(x, y, 0);
    for (let i = 0; i <= 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      positions.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 0);
      if (i) indices.push(start, start + i, start + i + 1);
    }
  };
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [x0, y0] = path[i - 1];
      const [x1, y1] = path[i];
      const length = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / length * radius;
      const ny = (x1 - x0) / length * radius;
      const start = positions.length / 3;
      positions.push(x0 + nx, y0 + ny, 0, x0 - nx, y0 - ny, 0,
        x1 + nx, y1 + ny, 0, x1 - nx, y1 - ny, 0);
      indices.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
      disc(x0, y0);
      if (i === path.length - 1) disc(x1, y1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function sample(fn: (t: number) => Point, steps = 18): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => fn(i / steps));
}

function ellipse(x: number, y: number, rx: number, ry: number) {
  return sample((t) => [x + Math.cos(t * Math.PI * 2) * rx, y + Math.sin(t * Math.PI * 2) * ry], 24);
}

function eyePaths(expression: Expression): Point[][] {
  return [-1, 1].flatMap((side) => {
    const cx = side * 0.225;
    switch (expression) {
      case "smile":
        return [sample((t) => [cx - 0.105 + t * 0.21, Math.sin(t * Math.PI) * 0.07 - 0.015])];
      case "cry":
        return [sample((t) => [cx - 0.09 + t * 0.18, -Math.sin(t * Math.PI) * 0.035])];
      case "angry":
        return [[[cx - 0.085, side * 0.04], [cx + 0.085, -side * 0.04]] as Point[]];
      case "sleepy":
        return [sample((t) => [cx - 0.095 + t * 0.19, -Math.sin(t * Math.PI) * 0.018])];
      case "dizzy":
        return [sample((t) => [cx + Math.cos(t * Math.PI * 4) * (0.012 + t * 0.085),
          Math.sin(t * Math.PI * 4) * (0.012 + t * 0.085)], 36)];
      case "confused":
        return [ellipse(cx, 0, 0.055, side === -1 ? 0.085 : 0.045)];
      default:
        return [ellipse(cx, 0, 0.055, 0.09)];
    }
  });
}

function detailPaths(expression: Expression): Point[][] {
  switch (expression) {
    case "cry":
      return [sample((t) => [-0.11 + t * 0.22, -0.19 + Math.sin(t * Math.PI) * 0.055]),
        [[-0.225, 0.025], [-0.24, -0.085], [-0.255, -0.13]],
        [[0.225, 0.025], [0.24, -0.085], [0.255, -0.13]]];
    case "angry":
      return [[[-0.085, -0.16], [0, -0.145], [0.085, -0.16]],
        [[-0.32, 0.29], [-0.13, 0.235]], [[0.13, 0.235], [0.32, 0.29]]];
    case "sleepy":
      return [ellipse(0, -0.16, 0.035, 0.05)];
    case "dizzy":
      return [[[-0.105, -0.155], [-0.052, -0.18], [0, -0.145], [0.052, -0.18], [0.105, -0.155]]];
    case "confused":
      return [[[-0.075, -0.17], [0.075, -0.145]], [[0.14, 0.275], [0.30, 0.30]]];
    default:
      return [sample((t) => [-0.12 + t * 0.24, -0.13 - Math.sin(t * Math.PI) * (expression === "smile" ? 0.07 : 0.035)])];
  }
}

export function createRobotFace() {
  const root = new Group();
  root.name = "Minty expression display";
  const layers = new Map<Expression, { group: Group; eyes: Group; material: MeshBasicMaterial }>();
  const geometries: BufferGeometry[] = [];
  for (const expression of EXPRESSIONS) {
    const group = new Group();
    const eyes = new Group();
    const material = new MeshBasicMaterial({
      color: expression === "angry" ? "#ffc3a0" : expression === "cry" ? "#83dcff" : "#71f5e0",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const eyeGeometry = strokes(eyePaths(expression), expression === "neutral" ? 0.055 : 0.034);
    const detailGeometry = strokes(detailPaths(expression), 0.025);
    geometries.push(eyeGeometry, detailGeometry);
    eyes.add(new Mesh(eyeGeometry, material));
    eyes.position.y = 0.13;
    group.add(eyes, new Mesh(detailGeometry, material));
    group.visible = false;
    root.add(group);
    layers.set(expression, { group, eyes, material });
  }
  return {
    root,
    applyPose(pose: RobotPose) {
      const mix = Math.max(0, Math.min(1, pose.expressionMix));
      for (const [expression, layer] of layers) {
        const amount = expression === pose.expression ? (pose.expressionFrom === expression ? 1 : mix)
          : expression === pose.expressionFrom ? 1 - mix : 0;
        layer.group.visible = amount > 0.001;
        layer.material.opacity = amount;
        layer.eyes.scale.y = Math.max(0.035, pose.eyeOpen);
        layer.eyes.position.x = pose.gazeX * 0.035;
        layer.eyes.position.y = 0.13 + pose.gazeY * 0.025;
      }
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const layer of layers.values()) layer.material.dispose();
    },
  };
}

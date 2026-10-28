/* Actual uploaded GLB + Three.js geometry checks; no browser/WebGL is simulated.
 * PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-robot-rig.cjs
 * Optional ROBOT_SOURCE_GLB=/path/to/upload.glb verifies byte-for-byte preservation.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const base = path.resolve(__dirname, '..');
const ts = require(process.env.PORTFOLIO_TEST_DEPS
  ? path.join(process.env.PORTFOLIO_TEST_DEPS, 'typescript') : 'typescript');
const hash = value => createHash('sha256').update(value).digest('hex');

async function run() {
  const temporary = fs.mkdtempSync(path.join(base, '.robot-rig-check-'));
  try {
    for (const name of ['rig', 'face', 'behavior']) {
      const source = fs.readFileSync(path.join(base, 'app/robot', name + '.ts'), 'utf8');
      const compiled = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 },
      }).outputText.replaceAll('"./face"', '"./face.mjs"');
      fs.writeFileSync(path.join(temporary, name + '.mjs'), compiled);
    }
    const { Box3, Mesh, OrthographicCamera, Vector3 } = await import('three');
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const { createRobotRig } = await import(pathToFileURL(path.join(temporary, 'rig.mjs')).href);
    const { createRobotAnimator, stepRobotAnimator, settleRobotAnimator } = await import(pathToFileURL(path.join(temporary, 'behavior.mjs')).href);
    const bytes = fs.readFileSync(path.join(base, 'public/models/minty_robot_v2.glb'));
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    assert.ok(bytes.byteLength < 1_600_000, 'Model download remains below 1.6 MB');
    if (process.env.ROBOT_SOURCE_GLB) assert.equal(hash(bytes), hash(fs.readFileSync(process.env.ROBOT_SOURCE_GLB)), 'The supplied GLB remains byte-for-byte intact');
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const sourceMeshes = [];
    gltf.scene.traverse(object => { if (object instanceof Mesh) sourceMeshes.push(object); });
    assert.equal(sourceMeshes.length, 55, 'Load the actual 55-part supplied robot');
    const snapshot = sourceMeshes.map(mesh => ({
      name: mesh.name,
      position: hash(Buffer.from(mesh.geometry.attributes.position.array.buffer)),
      attributes: Object.keys(mesh.geometry.attributes),
      material: mesh.material.toJSON(),
    }));
    const rig = createRobotRig(gltf.scene);
    assert.equal(rig.leftArm.children.length, 2, 'Left paddle and mint inset pivot together');
    assert.equal(rig.rightArm.children.length, 2, 'Right paddle and mint trim pivot together');
    const sourceGeometrySet = new Set(sourceMeshes.map(mesh => mesh.geometry));
    rig.root.traverse(object => {
      if (!(object instanceof Mesh)) return;
      assert.ok(!sourceGeometrySet.has(object.geometry), 'Rig owns its cloned geometries');
      if (!object.name) return; // Expression strokes are unlit and need no normals.
      assert.ok(object.geometry.attributes.normal, 'Rounded source meshes have vertex normals');
      assert.equal(object.castShadow, false);
    });

    const sceneSource = fs.readFileSync(path.join(base, 'app/robot/RobotScene.tsx'), 'utf8');
    const frameHeight = Number(sceneSource.match(/size\.height\s*\/\s*([\d.]+)/)[1]);
    const frameWidth = Number(sceneSource.match(/size\.width\s*\/\s*([\d.]+)/)[1]);
    const viewports = [[240, 208], [200, 176], [160, 140], [212, 236]];
    const cameras = viewports.map(([width, height]) => {
      const zoom = Math.min(height / frameHeight, width / frameWidth);
      const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 40);
      camera.zoom = zoom;
      camera.position.set(0, 3.1, 11);
      camera.lookAt(0, 1.15, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      return camera;
    });
    const projected = new Vector3();
    const maximum = { x: 0, y: 0 };
    const bounds = new Box3();
    let downMinimum = Infinity;
    let downBodyHeight = Infinity;
    const sourceNames = sourceMeshes.map(mesh => mesh.name);

    for (const seed of [0.2, 0.8]) {
      const animator = createRobotAnimator(() => seed);
      for (let frame = 0; frame < 14 * 60; frame++) {
        rig.applyPose(stepRobotAnimator(animator, 1 / 60));
        rig.root.traverseVisible(mesh => {
          if (!(mesh instanceof Mesh)) return;
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          bounds.copy(mesh.geometry.boundingBox);
          for (const x of [bounds.min.x, bounds.max.x]) {
            for (const y of [bounds.min.y, bounds.max.y]) {
              for (const z of [bounds.min.z, bounds.max.z]) {
                for (const camera of cameras) {
                  projected.set(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera);
                  maximum.x = Math.max(maximum.x, Math.abs(projected.x));
                  maximum.y = Math.max(maximum.y, Math.abs(projected.y));
                  assert.ok(Math.abs(projected.x) <= 0.98 && Math.abs(projected.y) <= 0.98,
                    `${animator.state} must fit its canvas at all startup frames: ${projected.toArray()}`);
                }
              }
            }
          }
        });
        if (animator.state === 'down' && animator.elapsed > 0.5 && frame % 30 === 0) {
          let lowest = Infinity;
          rig.body.traverseVisible(mesh => {
            if (!(mesh instanceof Mesh)) return;
            const positions = mesh.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
              projected.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
              lowest = Math.min(lowest, projected.y);
            }
          });
          assert.ok(lowest > -0.015 && lowest < 0.06, `Fallen shell meets the floor (${lowest})`);
          downMinimum = Math.min(downMinimum, lowest);
          downBodyHeight = Math.min(downBodyHeight, rig.body.position.y);
        }
      }
      rig.applyPose(settleRobotAnimator(animator));
      assert.equal(rig.body.rotation.z, 0, 'Reduced motion immediately stands the robot upright');
      assert.equal(rig.head.rotation.z, 0);
    }

    const pose = settleRobotAnimator(createRobotAnimator());
    const faceMeshes = [];
    rig.face.traverse(object => { if (object instanceof Mesh) faceMeshes.push(object); });
    const geometryIdentities = faceMeshes.map(mesh => mesh.geometry);
    const eyeGroup = rig.face.getObjectByName('Minty eyes');
    const leftEye = rig.face.getObjectByName('Minty left eye').children[0];
    const featureSignatures = new Set();
    const assertFaceContours = () => {
      for (const mesh of faceMeshes) {
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        const index = geometry.index;
        for (let i = 0; i < positions.count; i++) {
          assert.ok(Number.isFinite(positions.getX(i)) && Number.isFinite(positions.getY(i)) && Number.isFinite(positions.getZ(i)), 'Face contours stay finite');
        }
        // Front-face winding matters in WebGL even when an offline SVG renderer
        // would draw both sides. All triangles must face toward the visitor.
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
          const area = (positions.getX(b) - positions.getX(a)) * (positions.getY(c) - positions.getY(a))
            - (positions.getY(b) - positions.getY(a)) * (positions.getX(c) - positions.getX(a));
          assert.ok(area >= -1e-9, `Face triangles have consistent front-facing winding (${area})`);
        }
      }
    };
    const expressions = ['neutral', 'smile', 'cry', 'angry', 'sleepy', 'dizzy', 'confused'];
    for (const expression of expressions) {
      rig.applyPose({ ...pose, expression, expressionFrom: expression, expressionMix: 1 });
      assertFaceContours();
      featureSignatures.add(hash(Buffer.from(leftEye.geometry.attributes.position.array.buffer)) + ':' + rig.face.getObjectByName('Minty mouth').position.y);
      assert.equal(eyeGroup.children.length, 2, 'Every expression keeps one pair of eyes');
    }
    assert.equal(featureSignatures.size, expressions.length, 'Every expression has a distinct eye/mouth configuration');
    for (const from of expressions) {
      for (const expression of expressions) {
        for (let step = 0; step <= 8; step++) {
          rig.applyPose({ ...pose, expression, expressionFrom: from, expressionMix: step / 8, eyeOpen: 0.04 });
          assertFaceContours();
          assert.equal(eyeGroup.scale.y, 0.055, 'Blinking closes the same two eyes about their fixed centers');
          assert.deepEqual(faceMeshes.map(mesh => mesh.geometry), geometryIdentities, 'Expression changes reuse all geometries instead of layering duplicate faces');
          for (const eye of eyeGroup.children) assert.equal(eye.children[1].visible, false, 'Closed lids do not leave floating catchlights');
        }
      }
    }

    const rootChildren = rig.root.children.length;
    rig.dispose();
    assert.equal(rig.root.children.length, rootChildren, 'Strict Mode cleanup does not destroy the reusable hierarchy');
    rig.applyPose(pose);
    sourceMeshes.forEach((mesh, index) => {
      assert.equal(mesh.name, sourceNames[index]);
      assert.equal(hash(Buffer.from(mesh.geometry.attributes.position.array.buffer)), snapshot[index].position);
      assert.deepEqual(Object.keys(mesh.geometry.attributes), snapshot[index].attributes);
      assert.deepEqual(mesh.material.toJSON(), snapshot[index].material, 'Cached loader materials are untouched');
    });
    console.log(`PASS: actual GLB rig, both startup spin directions, ${viewports.length} viewport sizes, shoulder pivots, all facial states, reduced motion, ownership/disposal.`);
    console.log(`Maximum projected bounds x=${maximum.x.toFixed(3)}, y=${maximum.y.toFixed(3)}; fallen shell floor clearance=${downMinimum.toFixed(3)}, body pivot=${downBodyHeight.toFixed(3)}.`);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });

/* Real Three geometry checks, including every mood transition and lid aperture.
 * PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-robot-face.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const base = path.resolve(__dirname, '..');
const ts = require(process.env.PORTFOLIO_TEST_DEPS ? path.join(process.env.PORTFOLIO_TEST_DEPS, 'typescript') : 'typescript');

async function main() {
  const temporary = fs.mkdtempSync(path.join(base, '.robot-face-check-'));
  let face;
  try {
    for (const name of ['face', 'behavior']) {
      const source = fs.readFileSync(path.join(base, 'app/robot', `${name}.ts`), 'utf8');
      fs.writeFileSync(path.join(temporary, `${name}.mjs`), ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 },
      }).outputText);
    }
    const { createRobotFace } = await import(pathToFileURL(path.join(temporary, 'face.mjs')).href);
    const { createRobotAnimator, settleRobotAnimator } = await import(pathToFileURL(path.join(temporary, 'behavior.mjs')).href);
    face = createRobotFace();
    const pose = createRobotAnimator().pose;
    const eyes = face.root.getObjectByName('Minty eyes');
    const mouth = face.root.getObjectByName('Minty mouth');
    const tears = face.root.getObjectByName('Minty tears');
    const meshes = [];
    face.root.traverse(object => { if (object.isMesh) meshes.push(object); });
    const geometries = meshes.map(mesh => mesh.geometry);
    const materials = meshes.map(mesh => mesh.material);
    for (const mesh of meshes) assert.ok(mesh.material.isMeshBasicMaterial, 'The face stays legible without a lighting-dependent shader');

    // Get the exact polygonal aperture rather than recreating its formula.
    function aperture(shape, x) {
      const positions = shape.geometry.attributes.position;
      const rows = positions.count / 4;
      for (let i = 0; i < rows - 1; i++) {
        const left = positions.getX(i * 4), right = positions.getX((i + 1) * 4);
        if (x >= left - 1e-7 && x <= right + 1e-7) {
          const amount = Math.max(0, Math.min(1, (x - left) / (right - left)));
          return {
            top: positions.getY(i * 4) * (1 - amount) + positions.getY((i + 1) * 4) * amount,
            upperBottom: positions.getY(i * 4 + 1) * (1 - amount) + positions.getY((i + 1) * 4 + 1) * amount,
            lowerTop: positions.getY(i * 4 + 2) * (1 - amount) + positions.getY((i + 1) * 4 + 2) * amount,
            bottom: positions.getY(i * 4 + 3) * (1 - amount) + positions.getY((i + 1) * 4 + 3) * amount,
          };
        }
      }
      assert.fail(`Feature escapes the eye horizontally at ${x}`);
    }
    function inside(shape, x, y) {
      const edge = aperture(shape, x);
      assert.ok(y <= edge.top + 1e-6 && y >= edge.bottom - 1e-6,
        `Feature is clipped to its real eye contour (${x}, ${y}, ${edge.bottom}..${edge.top})`);
      assert.ok(y >= edge.upperBottom - 1e-6 || y <= edge.lowerTop + 1e-6, 'Features do not bridge the opening gap in dizzy X eyes');
    }
    function checkContours() {
      for (const mesh of meshes) {
        const position = mesh.geometry.attributes.position;
        const indices = mesh.geometry.index;
        for (let i = 0; i < position.count; i++) {
          assert.ok(Number.isFinite(position.getX(i)) && Number.isFinite(position.getY(i)) && Number.isFinite(position.getZ(i)));
        }
        for (let i = 0; i < indices.count; i += 3) {
          const a = indices.getX(i), b = indices.getX(i + 1), c = indices.getX(i + 2);
          const area = (position.getX(b) - position.getX(a)) * (position.getY(c) - position.getY(a))
            - (position.getY(b) - position.getY(a)) * (position.getX(c) - position.getX(a));
          assert.ok(area >= -1e-9, 'Morphing eye/pupil/mouth triangles always face the visitor');
        }
      }
    }
    face.applyPose(pose);
    for (const eye of eyes.children) {
      const shape = eye.children[0];
      shape.geometry.computeBoundingBox();
      assert.ok(shape.geometry.boundingBox.max.y - shape.geometry.boundingBox.min.y > 0.2, 'Greeting smile has open attentive eyes');
      assert.equal(eye.children[1].visible, true, 'Greeting has a consistent catchlight');
      assert.equal(eye.children[2].visible, true, 'Greeting has a visible dark pupil');
      assert.ok(eye.children[1].renderOrder > eye.children[2].renderOrder,
        'Catchlights draw after pupils even when a head turn changes projected mesh-center depth');
      assert.equal(eye.children[1].material.depthTest, true, 'The shell still occludes glints during a spin');
      assert.equal(eye.children[2].material.depthTest, true, 'The shell still occludes pupils during a spin');
    }
    const expressions = ['neutral', 'smile', 'cry', 'angry', 'sleepy', 'dizzy', 'confused'];
    let combinations = 0;
    for (const expressionFrom of expressions) for (const expression of expressions) {
      for (const expressionMix of [0, 0.25, 0.5, 0.75, 1]) for (const eyeOpen of [0.04, 0.19, 0.35, 0.7, 1]) {
        for (const gaze of [-1, 0, 1]) {
          face.applyPose({ ...pose, expressionFrom, expression, expressionMix, eyeOpen, gazeX: gaze, gazeY: -gaze, faceTime: 0.7 });
          for (const eye of eyes.children) {
            const [shape, glint, pupil] = eye.children;
            if (eyeOpen <= 0.18) {
              assert.equal(pupil.visible, false, 'A fully closed blink hides every pupil');
              assert.equal(glint.visible, false, 'A fully closed blink hides every catchlight');
            }
            const position = pupil.geometry.attributes.position;
            for (let i = 0; i < position.count; i++) inside(shape, position.getX(i), position.getY(i));
            if (glint.visible) {
              const radius = 0.0145;
              for (const dx of [-radius, radius]) for (const dy of [-radius, radius]) {
                inside(shape, glint.position.x + dx, glint.position.y + dy * glint.scale.y);
              }
            }
          }
          checkContours();
          assert.deepEqual(meshes.map(mesh => mesh.geometry), geometries, 'All face geometry identities remain stable');
          assert.deepEqual(meshes.map(mesh => mesh.material), materials, 'No per-frame materials are allocated');
          combinations++;
        }
      }
    }
    face.applyPose({ ...pose, gazeX: -0.72 });
    const leftPupilX = eyes.children[0].children[2].geometry.attributes.position.getX(64);
    face.applyPose({ ...pose, gazeX: 0.72 });
    const rightPupilX = eyes.children[0].children[2].geometry.attributes.position.getX(64);
    assert.ok(rightPupilX - leftPupilX > 0.06, 'Intentional gaze moves the inset pupils clearly');
    face.applyPose({ ...pose, expression: 'sleepy', expressionFrom: 'sleepy', expressionIntensity: 0 });
    assert.equal(mouth.children[1].visible, false, 'A tired face does not hold a permanent open yawn');
    face.applyPose({ ...pose, expression: 'sleepy', expressionFrom: 'sleepy', expressionIntensity: 1 });
    assert.equal(mouth.children[1].visible, true);
    assert.ok(mouth.children[1].scale.y > 0.07, 'The yawn opens with the acting envelope');
    face.applyPose({ ...pose, expression: 'cry', expressionFrom: 'cry', faceTime: 0.2 });
    const tearStart = tears.children[0].position.y;
    face.applyPose({ ...pose, expression: 'cry', expressionFrom: 'cry', faceTime: 0.8 });
    assert.ok(tears.children[0].position.y < tearStart, 'Tears travel down the face');
    assert.notEqual(tears.children[0].material.opacity, tears.children[1].material.opacity, 'Tear timing is offset between the eyes');
    const resting = settleRobotAnimator(createRobotAnimator());
    face.applyPose(resting);
    const snapshot = meshes.map(mesh => Array.from(mesh.geometry.attributes.position.array));
    face.applyPose(resting);
    assert.deepEqual(meshes.map(mesh => Array.from(mesh.geometry.attributes.position.array)), snapshot, 'Reduced-motion face remains still');
    const uniqueGeometries = [...new Set(geometries)], uniqueMaterials = [...new Set(materials)];
    let disposedGeometry = 0, disposedMaterial = 0;
    uniqueGeometries.forEach(geometry => geometry.addEventListener('dispose', () => disposedGeometry++));
    uniqueMaterials.forEach(material => material.addEventListener('dispose', () => disposedMaterial++));
    face.dispose();
    face = null;
    assert.equal(disposedGeometry, uniqueGeometries.length, 'Every owned geometry is disposed exactly once');
    assert.equal(disposedMaterial, uniqueMaterials.length, 'Every owned material is disposed exactly once');
    console.log(`PASS: open-eye greeting, clipped pupils/catchlights, ${combinations} mood/lid/gaze combinations, face winding, readable gaze, temporal tears/yawn, stable resources, reduced still and disposal.`);
  } finally {
    face?.dispose();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

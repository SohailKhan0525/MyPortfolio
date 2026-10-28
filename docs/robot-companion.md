# Minty hero companion

The existing portfolio gains one autonomous robot in the hero. Its terminal,
copy, project records, sections, navigation and theme remain intact. The supplied
`minty_robot_v2.glb` is served unchanged from `public/models/`; no replacement
character, remote model service, controls, or sound was added.

## Model and motion

- React Three Fiber 9 / Three.js load the 1.46 MiB GLB only near the hero. The
  renderer is a dynamically imported client component, separate from initial
  portfolio code. The asset has 55 named meshes and no skeleton or animations.
- `rig.ts` clones the loader's geometry/materials, computes missing vertex normals
  once, converts Z-up to Y-up, and adds neck and shoulder pivots. The source's
  raised left paddle is brought into a relaxed rest pose. The supplied body,
  head, visor and plinth remain the actual model.
- `face.ts` replaces only the original static face features with one morphing
  face: filled eyes, small catchlights, brows, tears and a curved mouth. Shared
  expression parameters interpolate on stable geometries, avoiding duplicate
  faces and overlapping translucent stroke discs. Eyelids close around the
  same eye centers, and catchlights disappear while closed. No face textures are
  uploaded during animation.
- `behavior.ts` owns one body state at a time. Startup is greeting (2.4s), pause
  (2s), blink, spin, dizzy wobble, fall, down, and slow recovery. Idle actions then
  choose randomized timings and include looks, tilts, smiles, crying, anger,
  tiredness, waves, spins and stumbles. A composed eyelid envelope provides random
  blinking after the intro. Frame deltas advance a bounded, reusable pose object;
  no React state updates occur per animation frame.
- The body uses a small support hull sampled once from the original geometry to
  meet the floor during the fall. The arms fold safely instead of forcing the
  whole fallen body to hover. An orthographic camera reserves room for every
  pose, including narrow canvases. The stage clips paint and never captures touch
  or pointer input.

## Rendering lifecycle

Reload reserves the stage without displaying a different static face. The scene
prepares its shaders with `compileAsync`, renders two quiet frames, then signals
readiness after rendering. Only then does the actual model fade in and begin its
greeting. Late callbacks cannot replace an error fallback after unmount.

The canvas switches between continuous and on-demand rendering. It pauses while
the page scrolls, leaves the viewport, or the tab is hidden, preserving animation
time so it cannot skip ahead on return. The existing shared passive scroll hook
handles its scroll state. Canvas scroll measurements are disabled; resize is
still observed. DPR is capped at 1.35, with no shadows, postprocessing, physics
engine, environment-map download, or animation controls.

The existing live reduced-motion provider selects an upright, smiling still pose.
Switching that preference on during a fall settles the robot immediately;
switching it off resumes quiet autonomous idle rather than restarting the fall.
A transparent still appears only if WebGL/model rendering fails. It is rendered
from the same runtime rig, initial smile, and camera as the animated robot,
rather than the original GLB's baked expression. Its responsive scale follows
the camera projection. The figure has one stable accessible label; expressions
are decorative and do not generate live announcements.

## Hero layout

Desktop grid placement precedes the responsive overrides. Below the existing
60rem tablet breakpoint, the robot, copy and terminal each explicitly occupy
column one; no implicit second column can compress phone text. Scoped mobile
rules provide 20px phone gutters, wrapping actions, compact top padding and
24px vertical gaps. Reserved stages are 236px on phones, 244px on tablets and
252px on desktop. All original hero copy, terminal and remaining sections stay.

## Checks

`scripts/check-robot-behavior.cjs` tests the full startup order and timing,
nonconflicting randomized actions, pose continuity, pause behavior, and bounded
spins over 30 simulated minutes. `scripts/check-robot-lifecycle.cjs` uses actual
React and the shared preference/scroll hooks, mocking only the heavy scene, to
verify SSR without a loading-image flash, lazy loading, playback gates, reduction
changes, cleanup, error-only fallback and the absence of controls.
`scripts/check-robot-scene.cjs` exercises the real scene with a controlled
renderer boundary to verify shader readiness, two-frame reveal, failure and
Strict Mode cancellation. `scripts/check-robot-layout.cjs` checks the actual CSS
cascade at ten phone/tablet/desktop widths in both stylesheet bundle orders.
`scripts/check-robot-rig.cjs` uses the actual GLB and Three geometry to check
preservation, shoulder pivots, floor contact, camera bounds, every expression
transition, face winding and stable geometry. Offline renders check appearance.
These are not claims of physical-phone frame-rate or GPU-pixel testing.

Run with test-only `jsdom@26.1.0` and `typescript@5.9.3` available through
`PORTFOLIO_TEST_DEPS`, following the setup comments in each test. The poster can
be regenerated on Node 22.13+ with `node scripts/render-robot-poster.mjs` using
Three and the Sharp dependency already available through Next. Add `--qa-dir`
with a scratch path to render startup and expression contact sheets.

## References consulted

- https://r3f.docs.pmnd.rs/getting-started/introduction — React 19 / Fiber 9 pairing.
- https://r3f.docs.pmnd.rs/advanced/scaling-performance — on-demand rendering,
  loader caching and draw-call costs.
- https://r3f.docs.pmnd.rs/advanced/pitfalls — frame-delta mutation rather than
  per-frame React state, geometry reuse and lifecycle costs.
- https://r3f.docs.pmnd.rs/api/canvas — fallback, DPR, resize and renderer options.
- https://threejs.org/docs/pages/GLTFLoader.html — glTF loading and ownership.
- https://threejs.org/docs/pages/WebGLRenderer.html — asynchronous shader
  preparation and the limits of transparent-object sorting.
- https://threejs.org/docs/pages/MeshBasicMaterial.html — unlit screen features.
- https://threejs.org/docs/pages/ShapeGeometry.html — filled polygonal features.

# Minty desktop companion

The existing portfolio has one autonomous robot fixed to the bottom-right corner. Its terminal,
copy, project records, sections, navigation and theme remain intact. The supplied
`minty_robot_v2.glb` is served unchanged from `public/models/`; no replacement
character, remote model service, controls, or sound was added.

## Model and motion

- React Three Fiber 9 / Three.js load the 1.46 MiB GLB after hydration. The
  renderer is a dynamically imported client component, separate from initial
  portfolio code. The asset has 55 named meshes and no skeleton or animations.
- `rig.ts` clones the loader's geometry/materials, computes missing vertex normals
  once, converts Z-up to Y-up, and adds neck and shoulder pivots. The source's
  raised left paddle is brought into a relaxed rest pose. The supplied body,
  head, visor and plinth remain the actual model. Only the small upper visor
  reflection is omitted at runtime because it resembled an extra eyebrow.
- `face.ts` replaces only the original static face features with one morphing
  face: larger capsule eyes, happy crescents, distinct angry/sleepy lids, small
  catchlights, brows, tears, restrained blush and a thicker curved mouth. Shared
  expression parameters interpolate on stable geometries, avoiding duplicate
  faces and overlapping translucent stroke discs. Eyelids close around the
  same eye centers, and catchlights disappear while closed. Mood geometry owns
  the heavy lids, avoiding a second pose-level squash that made them disappear.
  No face textures are
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

After hydration, a React portal mounts the fixed stage directly under `body`,
so page transforms and clipping cannot turn it into a scrolling element.
Loading keeps the stage transparent without displaying a different static face. The scene
prepares its shaders with `compileAsync`, renders two quiet frames, then signals
readiness after rendering. Only then does the actual model fade in and begin its
greeting. Late callbacks cannot replace an error fallback after unmount.

The canvas switches between continuous and on-demand rendering. It keeps playing
while scrolling through every section; the companion has no scroll listener or
intersection observer. It pauses when the tab is hidden, preserving animation
time so it cannot skip ahead on return. Canvas scroll measurements are disabled;
resize is still observed. DPR is capped at 1.35, with no shadows, postprocessing, physics
engine, environment-map download, or animation controls.

The existing live reduced-motion provider selects an upright, smiling still pose.
Switching that preference on during a fall settles the robot immediately;
switching it off resumes quiet autonomous idle rather than restarting the fall.
A transparent still appears only if WebGL/model rendering fails. It is rendered
from the same runtime rig, initial smile, and camera as the animated robot,
rather than the original GLB's baked expression. Its responsive scale follows
the camera projection. The figure has one stable accessible label; expressions
are decorative and do not generate live announcements.

## Fixed placement and hero layout

The body portal is fixed at the bottom-right with safe-area-aware insets. Its
transparent stage is 240 × 208px on desktop, 200 × 176px on phones, and
160 × 140px in short landscape windows. The whole subtree passes through taps,
clicks and swipes. The companion becomes transparent while the mobile menu is
open, so it cannot cover navigation, and is omitted in print.

The hero now has only its original copy and terminal in the layout. Both occupy
the first row on desktop; below 60rem they occupy rows one and two in a single
column. There is no empty robot row. Scoped mobile rules retain 20px phone
gutters, wrapping actions, compact top padding and 24px vertical gaps. All
original hero copy, terminal and remaining sections stay.

## Checks

`scripts/check-robot-behavior.cjs` tests the full startup order and timing,
nonconflicting randomized actions, pose continuity, pause behavior, and bounded
spins over 30 simulated minutes. `scripts/check-robot-lifecycle.cjs` uses actual
React and the shared motion preferences, mocking only the heavy scene, to
verify the hydration-only body portal, no loading-image flash, continuous scroll
playback without scroll-driven renders, hidden-tab/reduction gates, cleanup,
error-only fallback and the absence of controls.
`scripts/check-robot-scene.cjs` exercises the real scene with a controlled
renderer boundary to verify shader readiness, two-frame reveal, failure and
Strict Mode cancellation. `scripts/check-robot-layout.cjs` checks the actual CSS
cascade at phone/tablet/desktop widths and short landscape heights in both
stylesheet bundle orders, including safe areas, menu priority and touch passthrough.
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
- https://react.dev/reference/react-dom/createPortal — preserve React context while
  placing the viewport companion outside transformed page containers.
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position —
  fixed positioning and ancestor containing blocks.

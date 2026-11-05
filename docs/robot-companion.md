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
- The November quality pass separates pearl satin shells, soft mint insets,
  matte gaskets, metallic bearings and a dark coated visor. Only the visor uses
  `MeshPhysicalMaterial`; there is no extra glass shell or refraction pass.
- `face.ts` supplies one morphing face. The friendly smile has open eyes, dark
  inset pupils and small catchlights, so eye contact and blinking remain readable.
  Pupils move inside the same eye contour and are clipped geometrically to its
  aperture. Closed lids hide pupils and glints. Brows, asymmetric lids, mouth
  shape, moving tears and restrained cheek color distinguish the seven emotions.
  The sleepy mouth opens and closes with the yawn; crying includes a slight lip
  tremble. Geometry and materials are reused; no face textures are uploaded during
  animation.
- `behavior.ts` owns one body state at a time. Startup is greeting (2.4s), pause
  (2s), blink, spin, dizzy wobble, fall, down, and slow recovery. Idle actions then
  choose randomized timings and include looks, tilts, smiles, crying, anger,
  tiredness, waves, spins and stumbles. Faster eye movements lead head turns;
  blinks close quickly and reopen softly. Subtle sobs, brief bracing and a gradual
  yawn coordinate each mood with the body. The facial clock stops with the scene.
  Frame deltas advance a bounded, reusable pose object;
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
resize is still observed. The backing buffer starts at DPR 2, replacing the old
1.35 cap. Two consecutive slow two-second playback windows can lower it to 1.5,
then 1.25 after a cooldown. Warmup and hidden-tab gaps do not count. Quality only
steps down, so it cannot oscillate. React updates occur only at those tier changes.

A 128px PMREM generated once from Three's built-in room supplies broad studio
reflections, with a warm key, cool fill and mint rim. It is prepared before shader
warmup. The capture scene, generator and generated target have explicit cleanup.
There are no shadow maps, postprocessing, physics engine, environment-map
downloads or animation controls. At the 240×208 desktop stage, DPR 2 is a 480×416
backing buffer: sharper small-format rendering, not a literal 3840×2160 canvas.

The existing live reduced-motion provider selects an upright, smiling still pose.
Switching that preference on during a fall settles the robot immediately;
switching it off resumes quiet autonomous idle rather than restarting the fall.
A transparent still appears only if WebGL/model rendering fails. Blender Cycles
renders an export of the same runtime rig, initial smile and camera projection.
The served 1280×640 WebP uses soft studio lighting and replaces the previous SVG
renderer's faceted shading approximation. It is an error-only static fallback,
not an image displayed before model loading. Its responsive scale follows the
camera projection. The figure has one stable accessible label; expressions
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
`check-robot-quality.cjs` tests sustained-pressure adaptation, warmup, pause,
cooldown and bounded resolution. These are not claims of physical-phone frame
rate or live WebGL-pixel testing.

Run with test-only `jsdom@26.1.0` and `typescript@5.9.3` available through
`PORTFOLIO_TEST_DEPS`, following the setup comments in each test. The poster can
be regenerated on Node 22.13+ with `node scripts/render-robot-poster.mjs` using
Three, Sharp (already available through Next), and Blender for the offline Cycles
render. Blender is a local authoring tool, not a website or Vercel dependency.
Add `--qa-dir` with a scratch path for startup and expression contact sheets.

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
- https://threejs.org/docs/pages/MeshPhysicalMaterial.html — selective clearcoat,
  environment lighting and per-pixel costs.
- https://threejs.org/docs/pages/RoomEnvironment.html — local studio lighting
  without an HDR download.
- https://la.disneyresearch.com/publication/modeling-and-animating-eye-blinks/ —
  asymmetric blink dynamics and complete eyelid closure.
- https://www.animationmentor.com/blog/blink-for-a-reason-acting-advice-from-ilm-lead-animator-shawn-kelly/
  — gaze, head turns and emotional intent informing facial timing.
- https://react.dev/reference/react-dom/createPortal — preserve React context while
  placing the viewport companion outside transformed page containers.
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position —
  fixed positioning and ancestor containing blocks.

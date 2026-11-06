# Minty companion: GSAP runtime

Minty retains the original minty_robot_v2.glb sculpture and polished materials. To follow the GSAP-only redesign brief, the live page now uses transparent artwork rendered offline from that rig. There is no WebGL, canvas, React Three Fiber or Three.js in its client import graph.

`app/RobotCompanion.tsx` mounts in a body portal, fixed at the bottom-right, with pointer events disabled. Body, head and arms are separate transparent layers; shoulder pivots are projected from the model. Eleven head states include expressions, gaze positions and blink frames. A 24-view atlas supplies the sampled three-dimensional spin. These assets total 261,084 bytes; GSAP interpolates the continuous layer transforms.

The automatic opening is a smile and shoulder wave, a two-second pause, blink, spin, dizzy wobble, tumble, confused pause and slow recovery. A bounded timeline then selects randomized gaze, wave, tilt, smile, crying, anger, sleepiness, spin and stumble sequences. Rebuilding the same timeline keeps its retained children bounded. Breathing runs on a separate owned timeline.

Hidden tabs and an open navigation menu pause both timelines. Reduced motion immediately settles an upright smile. All essential layers load before the scene appears, avoiding an incomplete face/body flash. Optional spin media does not delay the greeting; a failed essential image uses the high-resolution static poster.

## Source and regeneration

The GLB, `app/robot/rig.ts`, `face.ts` and `behavior.ts` remain offline authoring sources. Three.js is a development dependency only. Run `node scripts/render-minty-layers.mjs` with Blender available to regenerate the deployed WebP layers and turn atlas. `scripts/render-robot-poster.mjs` still generates the static fallback.

## Checks

`scripts/check-gsap-companion.cjs` exercises actual React and GSAP, checks the 11.66-second startup and 50 randomized behavior cycles, one visible expression, hidden/menu pause, resume, reduced motion, failure fallback, portal placement and cleanup. It samples source alpha-pixel bounds through startup at desktop, mobile and short-landscape stage sizes. This is a controlled-DOM and pixel-bound test, not a physical-phone performance measurement.

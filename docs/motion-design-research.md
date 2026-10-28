# Portfolio illustration and motion pass

This pass builds on the existing terminal-led portfolio. All seven project records,
three AI product records, four learning milestones, skill descriptions, content
sections, routes, contact details and project destinations are retained.

## Art direction

Use the subjects of the work as the visual identity: architectural features and
regression, terrain and seismic signals, classification, records, ledgers and file
trees. Seven original SVG studies distinguish the selected projects. These are
labelled conceptual illustrations, not app screenshots, datasets or measured model
results. Fine strokes and a limited green signal color extend the existing dark
and light monochrome themes.

The hero's small data → model → app drawing is the signature interaction. A record
travels through the drawing once, with an explicit replay control. The functional
terminal stays in place. The redundant full-screen intro is removed so the actual
site is immediately available; the terminal retains its own startup sequence.

## Research and decisions

- [Bruno Simon's portfolio](https://bruno-simon.com/) uses one coherent personal
  interaction to express its creator's expertise. Our inference is to express
  Python/ML work through a data instrument, rather than borrow his 3D car concept.
- [Emil Kowalski, Good vs Great Animations](https://emilkowal.ski/ui/good-vs-great-animations)
  connects good easing, clear origins and spring interpolation to better interaction
  feedback. The selection indicator uses a damped spring; navigation opens from its
  header edge. Ordinary hover color changes use brief CSS transitions.
- [Josh Comeau, A Friendly Introduction to Spring Physics](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/)
  explains stiffness and damping as a model for natural movement. Selection and
  scroll indicators use highly damped springs with little overshoot.
- [Motion scroll documentation](https://motion.dev/docs/react-use-scroll) supports
  linking scroll motion values directly to transforms. The learning timeline fills
  with native page scrolling, without per-frame React state or forced scroll distance.
- [Motion accessibility](https://motion.dev/docs/react-accessibility) distinguishes
  automatic transform/layout reduction from custom animation handling. We use
  `MotionConfig reducedMotion="user"` and explicit `useReducedMotion` branches for
  SVG traces, the timeline and the top progress bar.
- [web.dev animation performance](https://web.dev/articles/animations-guide)
  recommends transforms and opacity to avoid layout work. The main movements use
  those properties. SVG stroke drawing is a bounded exception for the requested
  illustrations: one short path, 1.05 seconds, no continuous animation loop.
- [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
  explains the need for controls on qualifying automatic motion lasting over five
  seconds. The new hero trace lasts 2.2 seconds, project traces 1.05 seconds, and
  neither repeats automatically. The legacy pulsing visitor dot is now static.

## Implementation budget

Reuse the installed Motion and Radix libraries. Add no animation engine, raster
illustration downloads, canvas render loop, scroll interception or custom cursor.
Reserve space with SVG viewBoxes. Render text and complete drawings on the server;
animation is progressive enhancement. Honor reduced motion with completed drawings
and a static timeline. Keep the keyboard-operated terminal and disclosure semantics.

## Verification

- TypeScript 5.9.3 check: passed (the workspace cannot execute the installed native
  TypeScript 7 binary; Vercel validates with the project's installed dependencies).
- `git diff --check`: passed.
- Hallmark static audit: the existing resume `Projects` heading is still flagged
  by rule 54. It is the semantic section heading, not a redundant eyebrow; it is
  retained. Legacy stylesheet warnings remain where later styles override them.
- Production build and interactive browser verification: pending the preview build.

No frame-rate, Lighthouse or Core Web Vitals score is claimed from source review.

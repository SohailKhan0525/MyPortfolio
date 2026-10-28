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
- Vercel production-mode preview build: passed.
- Browser layouts: checked at 320, 375, 414, 768, 1024, 1280, 1440 and 1920px
  frame widths (the browser's scrollbar reduces content width by 15px); no
  horizontal overflow. Dark and light themes checked.
- All seven project selections display their matching illustration, title and
  source destination. Mobile selection scrolls the detail into view.
- Terminal submission, autocomplete and Tab escape checked. Mobile menu Escape
  handling and AI disclosure Enter/Space operation checked.
- Independent visual review: enlarged the mobile replay control text and confined
  terminal exit animation to its scrollable output region.
- Reduced-motion branches reviewed in source; this browser does not expose media
  emulation, so an emulated reduced-motion run is not claimed.

No frame-rate, Lighthouse or Core Web Vitals score is claimed from source review.

## Expanded portfolio choreography

The subsequent request explicitly asks for motion across the portfolio and a
direct push to main without temporary previews. The implementation now covers:

- Hero word entrances, followed by description, actions, proof and terminal.
- Once-per-visit section and row entrances using `useInView`, `useAnimate` and
  `stagger`, from complete, readable server-rendered markup.
- Spring hover, press and keyboard-focus feedback on actionable links/buttons.
- Shared navigation and project-selection indicators, project-detail entrances,
  presence-driven copy confirmation, and theme/menu icon transitions.
- Smooth accordion expansion and collapse, with staggered body content. This is
  a deliberate bounded height-animation exception for the requested interaction.
  Closed regions keep stable IDs and are immediately inert and aria-hidden.
- Scroll-linked timeline node fills and scale, plus the page-progress spring.
- Actual contribution/visitor number transitions and staggered chart-bar growth.
- The existing finite SVG traces and replayable data instrument.

The header motion control persists the visitor's choice. The operating system's
reduced-motion preference takes precedence. The shared setting stops imperative
sequences, custom traces and CSS transitions and renders their completed states.
No data, content sections, destinations or terminal commands are removed.

This uses the installed Motion 13 API set, not every demo or paid component in
the latest documentation. GSAP is not needed for these interactions. Primary
references: [scoped animation](https://motion.dev/docs/react-use-animate),
[gestures](https://motion.dev/docs/react-gestures), and
[presence](https://motion.dev/docs/react-animate-presence).

Pre-push checks: TypeScript and whitespace checks passed; project/skill/AI records,
section order and link destinations match the previous main. Independent source
review found no blocking preservation or reduced-motion issues. Live verification
follows the direct production deployment; no temporary preview is created.

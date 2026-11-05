# Motion refinement · 5 November 2026

This follow-up adds the more visible transitions and slower scroll easing requested after the visual refinement. The existing warm-paper design, seven projects, content, light default, saved dark choice, sticky AI headings and fixed Minty companion remain.

## Research and choices

- [Motion's useAnimate](https://motion.dev/docs/react-use-animate), [viewport observation](https://motion.dev/docs/react-use-in-view) and [stagger](https://motion.dev/docs/stagger) support short, scoped sequences. Section titles now rise word by word; supporting text follows; larger panels settle with a small lift and scale. Stationary wrappers own intersection observation, and critical server-rendered content stays readable.
- [Motion layout animations](https://motion.dev/docs/react-layout-animations) provide continuity when a selected project or filter changes. The detail enters in the direction of selection, with a short text stagger and an illustration transition. Action links update immediately outside the keyed animated region, so rapid selection never leaves an old destination active.
- [AnimatePresence](https://motion.dev/docs/react-animate-presence) handles mobile-menu exits. Exiting links become inert immediately; Escape restores trigger focus, destination clicks hand focus to the section, and outside/Tab navigation closes the menu.
- [Lenis](https://github.com/darkroomengineering/lenis), pinned at 1.3.27, provides approximately 1.05-second cubic wheel and anchor easing. It operates on native window scroll without a translated page wrapper. Touch momentum and keyboard scrolling stay native. The manual animation loop stops when idle and restarts with a fresh clock.

Timing values are project-specific tuning, not values prescribed by those sources. No additional GSAP layer, full-page blur or forced touch inertia is introduced. Motion retains responsibility for interface animation; Lenis only coordinates scrolling.

## Interaction and performance

- Section headings animate once when uncovered. Paragraphs, skills and panels use separate bounded entrances. Route arrival animates only small opening blocks, keeping fixed and sticky positioning intact.
- Nested terminal history, mobile project browsing and the open mobile menu retain native scrolling. Modified clicks, other routes, skip links, browser history, downloads and external links keep their ordinary behavior.
- Reduced-motion changes cancel pending transitions, settle content and remove the smooth-scroll controller live. Hidden tabs stop the controller. Effect cleanup removes listeners, animation frames and temporary focus attributes.
- Summary space keeps project actions from jumping during normal selection. On short screens, content remains in document flow.
- The final local optimized build contains 17 JavaScript chunks totaling 1,941,696 raw bytes and 562,167 gzip bytes, compared with 16 chunks / 1,911,488 / 550,701 before this change. This is the sum of all route and dynamic chunks, not the homepage's initial network payload. Added gzip total: 11,466 bytes (about 11.2 KiB).

## Verification

`npm run build` passes, including TypeScript and route prerendering. Regression checks pass:

- `check-smooth-scroll.cjs`: real Lenis intermediate easing, idle shutdown/restart, native touch/keyboard/nested scrolling, anchor history/focus, click propagation, interruption, visibility, reduced motion, StrictMode and cleanup.
- `check-navigation-motion.cjs`: actual panel/link transitions, focus restoration, inert exit, outside/Tab closing, rapid reopen, resize and reduced motion.
- `check-section-transitions.cjs`: readable SSR, independent entry, intermediate transforms, stagger, heading replay guard, live interruption and bounded route animation.
- `check-project-explorer.cjs`: seven original records and links, filters, focus, directional changes, rapid selection, immediate destinations and reduced-motion cancellation after delayed children.
- Existing motion, terminal, sticky-project, robot-layout and theme-default checks pass. The terminal expectation includes explicit start alignment in its native reduced-motion fallback.

Production browser inspection follows deployment. These checks do not establish physical-device frame rate.

# Portfolio refinement · November 2026

Product: a CSIT student's Python and machine-learning portfolio for collaborators and internship reviewers.
Character: precise, curious, playful.
Visual world: a working notebook, with warm paper, white working panels, dark ink and restrained green.
Key moments: a usable terminal and project studies with a clear route to the app and code.
Signature: Minty, the existing autonomous desktop companion.

The audit found a recognizable portfolio, so this is a refinement, not a replacement. All seven projects, descriptions, stacks, destinations and content sections remain. The terminal, logo, AI-product disclosures, contribution activity, learning journey and fixed companion remain.

## Research and decisions

- [Brittany Chiang's portfolio](https://brittanychiang.com/): project purpose and a clear destination help visitors assess work. The project browser now leads with the title, purpose and actions, with the existing drawings honestly labeled as concept studies.
- [Paco Coursey on redesign](https://paco.me/writing/redesign-2021): performance, simplicity and typography are useful priorities. This portfolio keeps Geist and its established layout, with more deliberate surface and spacing hierarchy.
- [Josh Comeau on whimsical animation](https://www.joshwcomeau.com/blog/whimsical-animations/): small, self-contained moments of feedback make interfaces more pleasant. Selection, theme changes, focus and tap feedback remain brief; the robot is the main autonomous flourish.
- [web.dev's animation guide](https://web.dev/articles/animations-guide): prefer transform and opacity work. No scroll hijacking, additional animation framework, mouse-follow layer or per-scroll React updates were introduced.

These are design principles, not copied portfolio layouts. Refinement workflow informed by *Unslop* by Damir Sokolovsky (@heydamir), licensed CC BY 4.0.

## Behavior

Fresh visits start in light mode, including on dark-mode operating systems. Explicit light/dark choices persist. An inline pre-paint bootstrap restores the choice on every route, avoiding a dark-first flash. Invalid or unavailable storage falls back to light.

The project browser filters the existing collection by project type. It changes selection only on activation and retains a matching selection when filtering. On narrow screens the project list is a native horizontal scroller, followed by the detail panel. Selecting a project does not move the page unexpectedly.

Terminal shortcuts execute their command directly, without opening a mobile keyboard. The editable terminal still supports command history, completion and Enter to run. Terminal history is bounded.

Existing reduced-motion handling and native scrolling are preserved. No new image, font or animation dependency is added.

## Verification

- `npm run build`: successful optimized build and prerendering of all routes.
- `check-theme-default.cjs`: pre-paint light default, saved choice, unavailable storage, hydration, normal and reduced-motion transitions, rapid taps.
- `check-project-explorer.cjs`: all original data and destinations, filters, keyboard focus, explicit selection, motion settling and no automatic page scrolling.
- `check-terminal.cjs`: one-tap commands, single sound event, boot guards, typing, completion, command recall, clear and bounded history.
- Existing `check-motion.cjs`, `check-sticky-projects.cjs` and `check-robot-layout.cjs`: motion lifecycle, sticky AI headers and responsive companion/hero cascade remain valid. The CSS cascade check covers ten widths from 320px to 1280px and four short landscape windows; it is not a physical-device performance test.
- Full TypeScript checking and `git diff --check`: pass.

Browser inspection and production deployment are checked separately during release. No frame-rate or physical-device performance claim is made from the automated checks.

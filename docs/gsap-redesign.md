# GSAP editorial redesign

The portfolio remains an account of Zaheer's actual work. All seven project records and destinations, three AI products and descriptions, terminal commands, contribution data, journey, skills, contact routes, analytics and secondary pages remain. Light mode is still the default; a visitor's chosen dark mode persists.

## Direction

A warm field notebook for machine learning: large forest-ink typography, precise dividers, numbered project studies, a working terminal, diagrams and a quiet chartreuse contact annotation. Scale and composition distinguish sections; no simulated loading screen or extra project claims were added.

The supplied section-wise animation brief and GSAP's official React, ScrollTrigger and performance skills guided the implementation. The selected effects are:

| Area | Selected pattern | Implementation |
| --- | --- | --- |
| Hero | Oversized line reveal, asymmetric entrance | SplitText and GSAP timelines; the headline remains readable in server HTML |
| Navigation | Curtain menu, link stagger, underline tracking | GSAP; semantic links, Escape/Tab behavior, immediate focus, inert background |
| Featured work | Sticky index, project cross-reveal, grid recomposition | ScrollTrigger, GSAP Flip; mobile selection rail plus Previous/Next |
| AI products | Stacked project chapters | Native sticky cards when their complete content fits; sticky headings or normal flow otherwise; GSAP scrub and disclosure timelines |
| Diagrams | Progressive path draw, moving data trace | DrawSVG and scoped timelines paused offscreen/hidden |
| Journey | Scroll-scrubbed timeline progression | ScrollTrigger, horizontal desktop rail and vertical narrow rail |
| Metrics | Count-up and staggered bars | GSAP; actual data only, final values available to assistive technology |
| Theme | Animated toggle and palette transition | GSAP icon and CSS custom-property interpolation, no Web Animations API |
| Contact/footer | Oversized headline, rising curtain, signature reveal | SplitText and ScrollTrigger; keyboard focus makes footer content visible |
| Minty | Layered character acting and sampled spin | GSAP plus pre-rendered artwork from the existing GLB, no live WebGL |

## Scroll and lifecycle decisions

GSAP ScrollToPlugin eases mouse-wheel movement in the real window. Touch input, horizontal gestures, editable elements, nested scroll regions, scrollbar interaction and keyboard input retain their native behavior. Native coordinates keep sticky projects, the footer and fixed companion working without a transformed page wrapper. Anchor navigation updates the URL and focuses its target; user input cancels pending animation.

Reduced motion restores static readable content immediately. `useGSAP` scopes component animations and reverts them on teardown. Replaceable window-scroll tweens have explicit ownership outside the long-lived context, avoiding retained dead tweens during wheel bursts. Controls reuse `quickTo` tweens. Legacy CSS timing is disabled; Motion and Lenis dependencies are removed.

Three.js is a development-only dependency for reproducible offline rendering. The React Three Fiber runtime and old RobotScene component are removed. The GLB is retained as the original source asset, not downloaded by the page.

## Validation

`npm run build` includes TypeScript and all route prerenders. Current regression suites run the real React/GSAP runtimes in a controlled DOM, not a mocked animation library:

```sh
PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-gsap-core.cjs
PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-gsap-navigation.cjs
PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-gsap-theme.cjs
PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-gsap-projects.cjs
PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-gsap-illustrations.cjs
PORTFOLIO_TEST_DEPS=/path/to/test/node_modules node scripts/check-gsap-companion.cjs
```

The external test dependency directory needs jsdom and TypeScript. Historical Motion/WebGL tests describe the retired implementation; the six GSAP suites are the current UI regression checks. Browser checks and device performance are separate from these controlled-DOM tests.

References: [official GSAP skills](https://github.com/greensock/gsap-skills), [React integration](https://gsap.com/resources/React/), [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [SplitText](https://gsap.com/docs/v3/Plugins/SplitText/), [Flip](https://gsap.com/docs/v3/Plugins/Flip/), [ScrollToPlugin](https://gsap.com/docs/v3/Plugins/ScrollToPlugin/).

# Architecture

## Application model

The portfolio uses the Next.js App Router. The main page is a client component because the experience includes interactive theme switching, terminal state, keyboard input, motion, and browser APIs.

```text
Browser
  │
  ├── app/layout.tsx
  │     ├── metadata / document shell
  │     ├── ThemeEnhancer
  │     └── ClickSound
  │
  ├── app/page.tsx
  │     ├── navigation + hero
  │     ├── interactive terminal
  │     ├── GitHub activity
  │     ├── projects / skills / about
  │     └── contact
  │
  └── app/api/github-contributions/route.ts
        └── GitHub contribution data
```

## Styling layers

The CSS is split by responsibility:

- `globals.css` — foundational tokens, typography, base layout, theme variables.
- `enhancements.css` — higher-level component polish, responsive behavior, and visual system refinements.
- `interaction-fixes.css` — defensive fixes for overflow, mobile interaction, terminal behavior, and reduced motion.

Keep new styles in the most appropriate layer instead of creating another global stylesheet for a single component.

## Interaction architecture

### Theme

The theme toggle updates the document theme state and persists the preference in browser storage. Theme-related visual effects are isolated from page content so they can be adjusted without changing the portfolio sections.

### Terminal

The terminal is intentionally client-side. It maintains command history, supports keyboard navigation, and exposes a small safe command set. It does not execute arbitrary shell commands.

Input is explicitly LTR so command text remains predictable on mobile browsers regardless of inherited document direction.

### GitHub activity

The contribution section obtains public contribution data and renders it as a compact activity grid. Failure states should remain non-blocking: the portfolio itself must still render if contribution data is unavailable.

## Design principles

1. **Content first** — typography and spacing establish hierarchy before decoration.
2. **Responsive by default** — layouts should flex or stack rather than depend on fixed widths.
3. **Progressive enhancement** — effects and activity data should not prevent core content from working.
4. **Accessible interaction** — keyboard focus, readable contrast, labels, and reduced-motion behavior matter as much as appearance.
5. **Small surface area** — avoid unnecessary dependencies when a focused CSS or React solution is clearer.

## Deployment

Production deployment is handled by Vercel. GitHub Actions independently verifies the application with dependency installation, type checking, and a production build.

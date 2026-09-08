# Development guide

## Prerequisites

Use Node.js 20.9 or newer. CI currently runs Node 24.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |

## Editing the UI

Start with the existing component structure in `app/page.tsx` and the shared design tokens in `app/globals.css`.

Before introducing a new component library or dependency, ask whether the requirement can be solved cleanly with the existing React + CSS system. The project favors small, composable primitives and open-source dependencies with clear value.

## Responsive testing checklist

Test at minimum:

- narrow mobile viewport;
- wide mobile viewport;
- tablet width;
- desktop width.

Pay particular attention to the terminal, navigation, project cards, contribution grid, and contact actions.

## Accessibility checklist

- All icon-only controls need an accessible name.
- Interactive controls must have visible focus states.
- Text inputs should preserve predictable LTR behavior for commands.
- Motion should respect `prefers-reduced-motion`.
- Do not rely on color alone to communicate state.

## Git workflow

Prefer short-lived branches for changes:

```text
main
 └── feature/focused-change
       └── pull request → main
```

Keep commits focused and avoid mixing documentation, dependency changes, and unrelated UI refactors unless they are part of the same change.

## Deployment checks

A pull request should pass the GitHub Actions production build before merge. Production deployment is managed separately by Vercel.

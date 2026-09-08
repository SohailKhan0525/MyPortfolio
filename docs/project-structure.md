# Project structure

This repository is organized around the Next.js App Router and keeps project governance close to the code.

## Root

- `README.md` — project overview, setup, architecture at a glance, and stack.
- `CONTRIBUTING.md` — contribution and review expectations.
- `CODE_OF_CONDUCT.md` — community behavior standard.
- `SECURITY.md` — security reporting and secret-handling guidance.
- `LICENSE` — MIT license.
- `package.json` — scripts and runtime dependencies.
- `next.config.ts` — Next.js configuration.
- `tsconfig.json` — TypeScript configuration.

## `.github`

- `workflows/next-build.yml` — CI build/type verification.
- `dependabot.yml` — scheduled npm dependency updates.
- `CODEOWNERS` — default ownership for repository changes.
- `pull_request_template.md` — PR quality checklist.
- `ISSUE_TEMPLATE/` — structured bug and feature reports.

## `app`

Next.js routes, application components, and styles live here.

- `page.tsx` — primary portfolio experience.
- `layout.tsx` — root document shell and metadata.
- `not-found.tsx` — application not-found page.
- `resume/` — resume route.
- `privacy/` — privacy route.
- `terms/` — terms route.
- `api/github-contributions/` — server route for contribution data.
- `ClickSound.tsx` — global click feedback.
- `ThemeEnhancer.tsx` — theme interaction effects.
- `globals.css` — base visual system.
- `enhancements.css` — component and responsive polish.
- `interaction-fixes.css` — defensive interaction and overflow fixes.

## `public`

Static assets such as favicons and brand imagery.

## `docs`

Longer technical documentation that would make the README unnecessarily large:

- `architecture.md` — runtime and interaction architecture.
- `development.md` — local workflow and quality checklist.
- `project-structure.md` — this repository map.

## Adding new code

Prefer placing code according to responsibility rather than creating catch-all folders. If a feature becomes substantial enough to have its own reusable UI primitives, data layer, or documentation, introduce a focused directory rather than increasing the size of `page.tsx` indefinitely.

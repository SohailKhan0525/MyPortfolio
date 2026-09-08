# Contributing

Thanks for helping improve the portfolio.

## Before you start

1. Check existing issues and pull requests to avoid duplicate work.
2. Keep changes focused and easy to review.
3. For larger changes, open an issue first so the direction can be agreed on.
4. Never commit secrets, credentials, `.env*` files, build output, or personal data.

## Local setup

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
```

## UI / UX changes

For interface changes:

- Test mobile and desktop layouts.
- Check keyboard focus and interactive states.
- Verify both light and dark themes.
- Check reduced-motion behavior when adding animations.
- Avoid horizontal overflow.
- Keep text readable and controls clearly labelled.
- Prefer existing design tokens and patterns over one-off styling.

## Pull requests

Use a concise title and explain:

- what changed;
- why it changed;
- how it was tested;
- whether screenshots or deployment checks are relevant.

Small, reviewable commits are preferred. Do not rewrite unrelated history or include generated files.

## Commit messages

Use clear, imperative messages such as:

- `fix: prevent terminal input from reversing on mobile`
- `feat: add project filtering`
- `docs: refresh repository structure`
- `refactor: simplify theme effects`

## Reporting bugs

Use the bug report template and include the browser, device, viewport, reproduction steps, and expected versus actual behavior when possible.

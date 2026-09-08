# Mohd Zaheer Uddin — Portfolio

A polished, responsive personal portfolio for **Mohd Zaheer Uddin**, a Computer Science undergraduate focused on Machine Learning and Data Science.

The current site is a **Next.js App Router** application with a calm, Luma-inspired interface, responsive layouts, light/dark themes, an interactive terminal, GitHub activity, motion, and accessible interaction states.

## ✨ Highlights

- Next.js App Router + React + TypeScript
- Responsive UI for mobile, tablet, and desktop
- Light/dark theme with animated transitions
- Interactive terminal-style command palette
- GitHub contribution/activity section
- Motion-based section reveals and micro-interactions
- Global click feedback with an optional sound layer
- Reduced-motion support
- Dedicated resume, privacy, terms, and not-found routes
- Vercel-ready production deployment
- GitHub Actions build verification

## 🧱 Repository structure

```text
MyPortfolio/
├── .github/
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── pull_request_template.md
│   └── workflows/
│       └── next-build.yml
├── app/
│   ├── api/github-contributions/
│   ├── privacy/
│   ├── resume/
│   ├── terms/
│   ├── ClickSound.tsx
│   ├── ThemeEnhancer.tsx
│   ├── enhancements.css
│   ├── globals.css
│   ├── interaction-fixes.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── docs/
│   ├── architecture.md
│   ├── development.md
│   └── project-structure.md
├── public/
│   └── static assets and icons
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── SECURITY.md
├── README.md
├── next.config.ts
├── package.json
└── tsconfig.json
```

See [`docs/project-structure.md`](docs/project-structure.md) for a more detailed map.

## 🚀 Run locally

### Requirements

- Node.js 20.9+ (Node 24 is used in CI)
- npm

### Install

```bash
npm install
```

### Start development

```bash
npm run dev
```

Open the local development URL shown by Next.js.

### Verify production build

```bash
npm run typecheck
npm run build
npm start
```

More development guidance is in [`docs/development.md`](docs/development.md).

## 🎨 Design direction

The UI follows a restrained open-source-product aesthetic: strong typography, rounded geometry, subtle elevation, generous spacing, clear focus states, and motion that supports hierarchy instead of competing with content.

The implementation is intentionally lightweight rather than depending on a large component framework. Phosphor Icons and Motion are used where they add clear value.

## 🧩 Main sections

- **Hero** — identity, role, theme control, and primary actions
- **Terminal** — interactive command-driven portfolio navigation
- **GitHub activity** — contribution visualization and profile context
- **Projects** — selected ML, Python, and application work
- **Skills** — practical tools and technologies
- **About / journey** — background and learning direction
- **Contact** — direct contact and social entry points
- **Resume** — dedicated resume route

## 🛠️ Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 / App Router |
| UI | React 19 + TypeScript |
| Motion | Motion for React |
| Icons | Phosphor Icons |
| Styling | CSS modules/global CSS + custom design tokens |
| Deployment | Vercel |
| CI | GitHub Actions |

## 🔐 Repository hygiene

The repository includes contribution, security, code-of-conduct, ownership, issue-template, dependency-update, and pull-request guidance.

Do not commit secrets, API keys, local environment files, build output, or generated dependency directories.

## 🤝 Contributing

This is a personal portfolio, but thoughtful fixes and suggestions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

## 🛡️ Security

For security-sensitive reports, follow [`SECURITY.md`](SECURITY.md) instead of opening a public issue.

## 📄 License

Released under the MIT License. See [`LICENSE`](LICENSE).

---

Built with care by **Mohd Zaheer Uddin**.

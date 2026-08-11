# MOHD ZAHEER UDDIN — Personal Portfolio

Single-page portfolio of **Mohd Zaheer Uddin**, a Computer Science (CSIT) undergraduate specialising in Machine Learning and Data Science. Styled as a code-editor / Jupyter Notebook, built with plain HTML, CSS, and JavaScript — no build step, no framework.

**Live site:** [sohailkhan0525.github.io/MyPortfolio](https://sohailkhan0525.github.io/MyPortfolio)

---

## Who Am I

- CSIT undergraduate specialising in ML & Data Science
- Focused on regression, classification, and applied ML with Python and Scikit-learn
- Actively seeking internship opportunities in ML/AI
- GitHub: [@SohailKhan0525](https://github.com/SohailKhan0525)
- LinkedIn: [Mohd Zaheer Uddin](https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/)

---

## Repository Files

| File | Description |
|------|-------------|
| `index.html` | Page layout: Home, Projects, About, Learning Journey, Skills, Resume, Certifications, Contact |
| `style.css` | All styling — code-editor / syntax-highlight theme, layout, responsive rules |
| `script.js` | Page behaviour — smooth scroll, typewriter, reveal animations, preloader, live GitHub project dates, hover panels, modal, skill bars |
| `q_logo_white.png` | Site logo (nav, footer, About) |
| `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png` | Favicon set for all browsers/devices |
| `MohdZaheerUddinResume.pdf` | Resume — viewable and downloadable from the site |
| `main.png` | Unused legacy asset, kept for reference |

---

## Key Features

- **Code-editor aesthetic** — JetBrains Mono / Fira Code, syntax-highlight colour palette, Jupyter-style `In [n]:` markers on project cards, git-log-styled Learning Journey timeline
- **Live GitHub project dates** — each project card fetches its repo's last-updated date directly from the GitHub API in the visitor's browser, cached locally for 6 hours
- **Themed GitHub contribution graph** in the footer
- **Typewriter role animation**, scroll-reveal sections, hero parallax on scroll
- **Fake "model training" preloader** (`Epoch 1/10 — loss: 0.74…`)
- **Lenis smooth scrolling**, paused automatically when the tab is hidden
- **Fully responsive** — mobile, tablet, and desktop, with a dedicated mobile nav and resume view
- **Reduced-motion support** via `prefers-reduced-motion`

---

## Content Sections

- **Home** — Hero with typewriter role cycling and CTAs
- **Projects** — Seven project cards with hover/tap detail panels, live demo links, GitHub links, and live-fetched last-updated dates
- **About Me** — Bio and goals
- **Learning Journey** — Git-log-styled timeline of skills picked up so far, plus a goals checklist
- **Skills & Tools** — Skill blocks with animated progress bars
- **Resume** — Embedded PDF viewer with fullscreen/download options
- **Certifications** — Placeholder (achievements coming soon)
- **Contact** — Mailto-based contact button and social links

### Projects Showcase

| # | Project | Type | Live Demo |
|---|---------|------|-----------|
| 1 | House Price Prediction | ML (Regression) | [Streamlit](https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/) |
| 2 | Global Earthquake Prediction | ML (Classification) | Model only |
| 3 | Heart Disease Prediction | ML (Logistic Regression) | [Streamlit](https://heartdiseaseml-4zrcurmudxpfxbwygcuyyt.streamlit.app/) |
| 4 | Student Management | Python App | [Streamlit](https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/) |
| 5 | Student Pass/Fail Predictor | ML (Classification) | [Streamlit](https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app) |
| 6 | Bank Management | Python App | [Streamlit](https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/) |
| 7 | File Handling | Python CLI App | No live demo |

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Scripting | Vanilla JavaScript (ES6+) |
| Smooth scroll | [Lenis](https://github.com/studio-freight/lenis) |
| Icons | [Font Awesome 6.5.2](https://fontawesome.com/) |
| Fonts | JetBrains Mono & Fira Code (Google Fonts) |
| Contact | `mailto:` link |

---

## How to Run Locally

Open `index.html` in any modern browser — no build step required.

---

## Customization Guide

- **Name & bio:** hero and About sections in `index.html`
- **Projects:** project cards in `index.html`
- **Skills:** skill blocks in `index.html`
- **Colors & fonts:** CSS variables at the top of `style.css`
- **Typewriter roles:** the `roles` array in `script.js`
- **Contact email:** the `mailto:` link in the Contact section of `index.html`
- **GitHub contribution graph:** replace the username in the footer graph URL in `index.html` (`ghchart.rshah.org/COLOR/USERNAME`)

---

## Notes

- Several project demos are hosted on Streamlit Community Cloud and may take a moment to wake up if inactive.
- The Global Earthquake Prediction and File Handling projects don't have live demos.

---

## License

MIT License — Copyright (c) 2025 Mohd Zaheer Uddin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

> If you use this portfolio as a template, please credit **Mohd Zaheer Uddin**.

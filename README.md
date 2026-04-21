# 🌐 MOHD ZAHEER UDDIN — Personal Portfolio

Modern, animated, single-page portfolio of **Mohd Zaheer Uddin**, a Computer Science (CSIT) undergraduate specialising in Machine Learning and Data Science.

🔗 **Live Website:**  
[Visit My Portfolio](https://sohailkhan0525.github.io/MyPortfolio)

---

## 👤 Who Am I

I am **Mohd Zaheer Uddin** — a Computer Science (CSIT) undergraduate with a focus on Machine Learning and Data Science. I build predictive models and deploy real-world ML applications using Python and Scikit-learn.

- 🎓 CSIT undergraduate specialising in ML & Data Science
- 🤖 Passionate about AI, regression, classification, and neural networks
- 📊 Experienced in data analysis, statistical modelling, and EDA
- 🚀 Actively seeking internship opportunities in ML/AI
- 🏷️ GitHub: [@SohailKhan0525](https://github.com/SohailKhan0525)
- 💼 LinkedIn: [Mohd Zaheer Uddin](https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/)

---

## ✅ Repository Files

| File | Description |
|------|-------------|
| `index.html` | Single-page layout with sections: Home, About, Projects, Skills, Resume, Certifications, and Contact |
| `style.css` | Complete styling system: neon glassmorphism, custom cursor, scroll reveal, layout grids, and responsive design |
| `script.js` | Frontend behaviour: Three.js particle background, Lenis smooth scroll, typewriter roles, preloader, mobile menu, gyroscope support, contact form (EmailJS), project hover-panels, modal popup, and skill progress bars |
| `favicon.ico` | Browser tab icon |
| `main.png` | Logo/hero image displayed in the About section |
| `MohdZaheerUddinResume.pdf` | Resume document, viewable and downloadable directly from the site |

---

## ✨ Key Features

### 🎨 Visual & Animation
- **3D animated particle background** powered by Three.js (particle sphere + wireframe icosahedron)
- **Cinematic letterbox bars** and grain noise overlay for a film-like aesthetic
- **Neon glassmorphism UI** with glowing cards and panels
- **Scroll progress indicator** bar at the top of the page
- **Typewriter role animation** cycling through AI/ML titles
- **Scroll reveal animations** as sections enter the viewport
- **Hero parallax effect** — text fades and scales as you scroll
- **Custom neon cursor** (desktop only)
- **Preloader screen** with a cyber-themed animation
- **Reduced-motion support** via `@media (prefers-reduced-motion: reduce)`

### 📱 Responsive & Performance
- **Fully responsive layout** for mobile, tablet, and desktop
- **Touch device detection** using `window.matchMedia` — adapts cursor, tilt, and card-tap behaviour
- **Two-tap interaction** on touch devices for project cards (first tap: highlight, second tap: open panel)
- **30 fps mobile cap** in the Three.js animation loop for reduced GPU load
- **Page Visibility API** integration — pauses Three.js rendering when the tab is hidden
- **Gyroscope support** on mobile for interactive 3D scene rotation
- **Lenis smooth scrolling** for a buttery-smooth scroll experience

### 🗂️ Content Sections
- **Home** — Hero with typewriter role cycling and call-to-action buttons
- **About Me** — Bio, background, and goal statement with photo
- **Projects** — Seven project cards with hover/tap detail panels, live demo, and GitHub links
- **Skills & Tools** — 22 skill blocks with animated progress bars
- **Resume** — Embedded PDF viewer with fullscreen and download options
- **Certifications** — Placeholder section (achievements coming soon)
- **Contact** — EmailJS-powered contact form and social links (LinkedIn, GitHub, Instagram)

### 🃏 Projects Showcase

| # | Project | Type | Live Demo |
|---|---------|------|-----------|
| 1 | **House Price Prediction** | ML Model (Regression) | [Streamlit](https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/) |
| 2 | **Global Earthquake Prediction** | ML Model (Classification) | Model only |
| 3 | **Heart Disease Prediction** | ML Model (Logistic Regression) | [Streamlit](https://heartdiseaseml-4zrcurmudxpfxbwygcuyyt.streamlit.app/) |
| 4 | **Student Management** | Python App | [Streamlit](https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/) |
| 5 | **Student Pass/Fail Predictor** | ML Model (Classification) | [Streamlit](https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app) |
| 6 | **Bank Management** | Python App | [Streamlit](https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/) |
| 7 | **File Handling** | Python CLI App | No live demo |

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, glassmorphism, grid, flexbox) |
| Scripting | JavaScript (Vanilla ES6+) |
| 3D / WebGL | [Three.js r128](https://threejs.org/) |
| Smooth Scroll | [Lenis v1.0.42](https://github.com/studio-freight/lenis) |
| Email | [EmailJS v3](https://www.emailjs.com/) |
| Icons | [Font Awesome 6.5.2](https://fontawesome.com/) |
| Fonts | Inter & Space Grotesk (Google Fonts) |

---

## ▶️ How to Run Locally

Open [index.html](index.html) in any modern browser — no build step required.

---

## 🔧 Customization Guide

- **Name & bio:** Update the hero and about sections in [index.html](index.html).
- **Projects:** Edit the project cards in [index.html](index.html) and the `projectData` object in [script.js](script.js).
- **Skills:** Modify skill blocks and percentages in [index.html](index.html).
- **Colors & styling:** Update CSS variables at the top of [style.css](style.css).
- **Typewriter roles:** Edit the `roles` array in [script.js](script.js).
- **EmailJS:** Replace `publicKey`, `serviceID`, and `templateID` in the `CONFIG` object at the top of [script.js](script.js) with your own EmailJS values.
- **Supabase analytics:**
  1. Replace `CONFIG.supabase.url` and `CONFIG.supabase.anonKey` in [script.js](script.js).
  2. Create table:
     `CREATE TABLE portfolio_visits (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, visited_at TIMESTAMPTZ DEFAULT now());`
  3. Create index:
     `CREATE INDEX idx_portfolio_visits_visited_at ON portfolio_visits(visited_at);`

---

## 📌 Notes

- The contact form relies on EmailJS and requires your own API keys to function.
- Several project demos are hosted on Streamlit Community Cloud — they may take a moment to wake up if inactive.
- The Global Earthquake Prediction and File Handling projects do not have live demos deployed.

---

## 📄 License

MIT License

Copyright (c) 2025 Mohd Zaheer Uddin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

> **Attribution:** If you use this portfolio as a template, please credit **Mohd Zaheer Uddin** in your project.
